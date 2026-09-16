import { addDays } from 'date-fns';

import { MembershipRole } from '~/lib/organizations/types/membership-role';
import { TeamMembershipInvite } from '~/lib/organizations/types/membership-invite';

import configuration from '~/configuration';
import { getUserInfoById } from '~/core/firebase/admin/auth/get-user-info-by-id';

import { getOrganizationById } from '../queries';
import logger from '~/core/logger';
import { getRetrospectiveById } from '../retrospectives/queries';
import { BoardMembershipInvite } from '~/lib/board/types/membership-role';
import {
  getBoardByRetrospective,
  getBoardMembersByRetrospective,
} from './queries';
import { getOrganizationsCollection } from '../collections';
import { Notification } from '~/lib/notifications/types/types';

import { sendEmail } from '~/lib/server/email/send-email';
interface Invite {
  email: string;
  role: MembershipRole;
  facilitator: string;
}

interface Params {
  organizationId: string;
  retrospectiveId: string;
  inviterId: string;
  invites: Invite[];
  type: string;
}

const INVITE_EXPIRATION_DAYS = 1;

export async function inviteMembers(params: Params) {
  const { organizationId, invites, inviterId, retrospectiveId, type } = params;

  const inviter = await getUserInfoById(inviterId);

  const organization = await getOrganizationById(organizationId);
  const organizationData = organization.data();

  const getBoard = await getBoardByRetrospective(
    organizationId,
    retrospectiveId,
  );
  const boardData = getBoard.data();

  const teamId = boardData?.teamId as string;

  const getRetrospective = await getRetrospectiveById(
    organizationId,
    teamId,
    retrospectiveId,
  );
  const retrospectiveData = getRetrospective.data();

  const getInviter = await getBoardMembersByRetrospective(
    organizationId,
    retrospectiveId,
  );
  const facilitatorData = getInviter.data();

  const inviterData = facilitatorData?.members[inviterId];

  if (!organizationData) {
    throw new Error(
      `Organization data with ID ${organizationId} was not found`,
    );
  }

  const retrospectiveName = retrospectiveData?.name as string;
  const inviterRole = inviterData?.role;
  //ONLY FOR TEAM AND PRIVATE (VERRIFY WITH EDO)
  // validate that the inviter is currently in the organization
  if (type != 'public') {
    if (inviterRole === undefined) {
      throw new Error(
        `Invitee with ID ${inviterId} does not belong to the organization`,
      );
    }
  }

  const path = organization.ref.collection('board').doc(retrospectiveId);
  const invitesCollection = path.collection(`invites`);
  const notificationsCollection = organization.ref.collection(`notifications`);

  const organizationRef = getOrganizationsCollection().doc(organizationId);
  const requests: Array<Promise<unknown>> = [];

  const expiresAt = addDays(new Date(), INVITE_EXPIRATION_DAYS).getTime();

  for (const invite of invites) {
    const ref = invitesCollection.doc();
    const notificationRef = notificationsCollection.doc();

    // validate that the user has permissions
    // to invite the user based on their roles
    // if (!canInviteUser(inviterRole, invite.role)) {
    //     return;
    // }

    const inviterDisplayName =
      invite.facilitator ?? inviter?.email ?? undefined;

    const organizationLogo = organizationData?.logoURL ?? undefined;

    const sendEmailRequest = (code: string) =>
      sendNotificationEmail({
        invitedUserEmail: invite.email,
        inviteCode: code,
        retrospectiveName,
        organizationLogo,
        inviter: inviterDisplayName,
      });

    const field: keyof TeamMembershipInvite = 'email';
    const op = '==';

    const existingInvite = await invitesCollection
      .where(field, op, invite.email)
      .where('retrospective.id', '==', retrospectiveId)
      .get();

    const existingNotification = await notificationsCollection
      .where(field, op, invite.email)
      .where('information.retrospectiveId', '==', retrospectiveId)
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

      const request = async () => {
        try {
          // update invitation document
          await doc.ref.update({ ...invite, created: new Date() });

          if (existingNotification.size > 0) {
            const notificationId = existingNotification.docs[0].id;

            const notificationRef = notificationsCollection.doc(notificationId);
            try {
              await notificationRef.update({ ...invite, created: new Date() });
            } catch (error) {
              console.error('Error updating notification:', error);
              throw error;
            }
          } else {

            const notificationData: Notification = {
              title: 'Invited',
              created: new Date(),
              category: 'invite',
              type: 'board',
              subtitle: `<p>You have been invited to <b>${retrospectiveData?.name}</b> by <b>${inviterDisplayName}</b></p>`,
              information: {
                organizationId,
                teamId,
                retrospectiveId,
                type,
                facilitator: inviterDisplayName,
                retrospectiveName: retrospectiveData?.name,
              },
              code: ref.id,
              email: invite.email,
              id: notificationRef.id,
              accepted: false,
              seen: false,
            };

            try {
              await notificationRef.set(notificationData); // Usa set() para crear el documento
            } catch (error) {
              console.error('Error creating notification:', error);
              throw error;
            }
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
        const data: BoardMembershipInvite = {
          ...invite,
          code: ref.id,
          expiresAt,
          organization: {
            id: organizationId,
            name: organizationData?.name ?? '',
          },
          retrospective: {
            id: retrospectiveId,
            name: retrospectiveName,
            type,
          },
          teamId,
          created: new Date(),
          type: 'board',
          accepted: false,
        };

        const notificationData: Notification = {
          title: 'Invited',
          created: new Date(),
          category: 'invite',
          type: 'board',
          subtitle: `<p>You have been invited to <b>${retrospectiveData?.name}</b> by <b>${inviterDisplayName}</b></p>`,
          information: {
            organizationId,
            teamId,
            retrospectiveId,
            type,
            facilitator: inviterDisplayName,
            retrospectiveName: retrospectiveData?.name,
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
  retrospectiveName: string;
  organizationLogo: Maybe<string>;
  inviter: Maybe<string>;
}) {
  const { invitedUserEmail, inviteCode, retrospectiveName, inviter } = props;

  const link = getInvitePageFullUrl(inviteCode);

  let data: any = {
    to: invitedUserEmail,
    subject: `RetroTeam - You have been invited by ${inviter} to ${retrospectiveName}`,
    template: 'board invite email template',
    'v:names': invitedUserEmail,
    'v:facilitator': inviter,
    'v:retrospective': `${retrospectiveName}`,
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
  assertSiteUrl(siteUrl);
  const url = [siteUrl, 'auth', 'invite', 'board', inviteCode].join('/');
  return url;
}

function assertSiteUrl(siteUrl: Maybe<string>): asserts siteUrl is string {
  if (!siteUrl && configuration.production) {
    throw new Error(
      `Please configure the "siteUrl" property in the configuration file ~/configuration.ts`,
    );
  }
}
