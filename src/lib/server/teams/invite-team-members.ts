import { addDays } from 'date-fns';

import { TeamMembershipInvite } from '~/lib/organizations/types/membership-invite';

import configuration from '~/configuration';
import { getUserInfoById } from '~/core/firebase/admin/auth/get-user-info-by-id';

import {
  getOrganizationById,
  getOrganizationMemberById,
  getTeamById,
} from '../queries';
import logger from '~/core/logger';
import { getOrganizationsCollection } from '../collections';
import { Notification } from '~/lib/notifications/types/types';

import { sendEmail } from '~/lib/server/email/send-email';
interface Invite {
  email: string;
  facilitator: string;
}

interface Params {
  organizationId: string;
  teamId: string;
  inviterId: string;
  invites: Invite[];
}

const INVITE_EXPIRATION_DAYS = 1;

export async function inviteMembers(params: Params) {
  const { organizationId, invites, inviterId, teamId } = params;

  const inviter = await getUserInfoById(inviterId);

  const organization = await getOrganizationById(organizationId);
  const organizationData = organization.data();

  const team = await getTeamById(organizationId, teamId);
  const teamData = team.data();

  if (!organizationData) {
    throw new Error(
      `Organization data with ID ${organizationId} was not found`,
    );
  }

  const organizationName = organizationData.name;
  const teamName = teamData?.name;

  const invitesCollection = organization.ref.collection(`invites`);

  const notificationsCollection = organization.ref.collection(`notifications`);

  const requests: Array<Promise<unknown>> = [];

  const expiresAt = addDays(new Date(), INVITE_EXPIRATION_DAYS).getTime();

  for (const invite of invites) {
    const ref = invitesCollection.doc();
    const notificationRef = notificationsCollection.doc();

    const inviterDisplayName =
      invite.facilitator ?? inviter?.email ?? undefined;

    const organizationLogo = organizationData?.logoURL ?? undefined;

    const sendEmailRequest = (code: string) =>
      sendNotificationEmail({
        invitedUserEmail: invite.email,
        inviteCode: code,
        organizationName,
        teamName,
        organizationLogo,
        inviter: inviterDisplayName,
      });

    const field: keyof TeamMembershipInvite = 'email';
    const op = '==';

    const existingInvite = await invitesCollection
      .where(field, op, invite.email)
      .where('type', '==', "team")
      .where('team.id', '==', teamId)
      .get();

    const existingNotification = await notificationsCollection
      .where(field, op, invite.email)
      .where('information.teamId', '==', teamId)
      .get();

    const inviteExists = !existingInvite.empty;

    // this callback will be called when the promise fails
    const catchCallback = (error: unknown) => {
      logger.error(
        {
          inviteId: ref.id,
          inviter: inviter?.uid,
          organizationId,
        },
        `Error while sending invite to member`,
      );

      logger.debug(error);

      return Promise.reject(error);
    };

    // if an invitation to the email {invite.email} already exists,
    // then we update the existing document
    if (inviteExists) {
      const doc = existingInvite.docs[0];
      const notificationDoc = existingNotification.docs[0];
      const request = async () => {
        try {
          // update invitation document
          await doc.ref.update({ ...invite, created: new Date() });
          if (notificationDoc) {
            await notificationDoc.ref.update({
              ...invite,
              created: new Date(),
            });
          } else {
            const data = doc.data();
            const notificationData: Notification = {
              title: 'Invited',
              created: new Date(),
              category: 'invite',
              type: 'team',
              subtitle: `<p>You have been invited to <b>${organizationName} - ${teamName}</b> by <b>${inviterDisplayName}</b> </p>`,
              information: {
                organizationId: organizationId,
                teamId: teamId,
                retrospectiveId: '',
                facilitator: inviterDisplayName,
                teamName: teamName,
              },
              code: data.code,
              email: invite.email,
              id: notificationRef.id,
              accepted: false,
              seen: false,
            };
            await notificationRef.set(notificationData);
          }

          // send email
          const docSnapshot = await doc.data();
          if (docSnapshot) {
            await sendEmailRequest(docSnapshot.code);
          } else {
            console.log('Invitation doesnt exists');
          }
        } catch (e) {
          return catchCallback(e);
        }
      };

      // add a promise for each invite
      requests.push(request());
    } else {
      // otherwise, we create a new document with the invite
      const request = async () => {
        const data: TeamMembershipInvite = {
          ...invite,
          code: ref.id,
          expiresAt,
          organization: {
            id: organizationId,
            name: organizationData?.name ?? '',
          },
          team: {
            id: teamId,
            name: teamName,
          },
          type: 'team',
          created: new Date(),
          accepted: false,
          id: notificationRef.id,
        };

        const notificationData: Notification = {
          title: 'Invited',
          created: new Date(),
          category: 'invite',
          type: 'team',
          subtitle: `<p>You have been invited to <b>${organizationName} - ${teamName}</b> by <b>${inviterDisplayName}</b> </p>`,
          information: {
            organizationId: organizationId,
            teamId: teamId,
            retrospectiveId: '',
            teamName: teamName,
            facilitator: inviterDisplayName,
          },
          code: ref.id,
          email: invite.email,
          id: notificationRef.id,
          accepted: false,
          seen: false,
        };
        try {
          
          // add invite to the Firestore collection
          await invitesCollection.add(data);
          await notificationRef.set(notificationData);

          // send email to user
          await sendEmailRequest(ref.id);
        } catch (e) {
          return catchCallback(e);
        }
      };

      // add a promise for each invite
      requests.push(request());
    }
  }
  // this callback will be called when the promise fails
  const catchCallback = (error: unknown) => {
    logger.error(
      {
        organizationId,
      },
      `Error while updating total invites`,
    );

    logger.debug(error);

    return Promise.reject(error);
  };

  return Promise.all(requests);
}

function sendNotificationEmail(props: {
  invitedUserEmail: string;
  inviteCode: string;
  organizationName: string;
  teamName: string;
  organizationLogo: Maybe<string>;
  inviter: Maybe<string>;
}) {
  const { invitedUserEmail, inviteCode, organizationName, teamName, inviter } =
    props;

  const link = getInvitePageFullUrl(inviteCode);

  let data: any = {
    to: invitedUserEmail,
    subject: `RetroTeam - You have been invited by ${inviter} to ${organizationName} - ${teamName}`,
    template: 'board invite email template',
    'v:names': invitedUserEmail,
    'v:facilitator': inviter,
    'v:retrospective': `${organizationName} - ${teamName}`,
    'v:invitation_code': link,
    'v:email': invitedUserEmail,
    'v:expiration': '24 hours',
  };

  void sendEmail(data);
}
/*
 * @name getInvitePageFullUrl
 * @description Return the full URL to the invite page link. For example,
 * <your-site-url>/auth/invite/{INVITE_CODE}
 * @param inviteCode
 */
function getInvitePageFullUrl(inviteCode: string) {
  let siteUrl = configuration.site.siteUrl;

  if (configuration.emulator) {
    siteUrl = getEmulatorHost();
  }

  assertSiteUrl(siteUrl);

  return [siteUrl, 'auth', 'invite', 'team', inviteCode].join('/');
}

function assertSiteUrl(siteUrl: Maybe<string>): asserts siteUrl is string {
  if (!siteUrl && configuration.production) {
    throw new Error(
      `Please configure the "siteUrl" property in the configuration file ~/configuration.ts`,
    );
  }
}

function getEmulatorHost() {
  const host = `http://localhost`;
  const port = 3000;

  return [host, port].join(':');
}
