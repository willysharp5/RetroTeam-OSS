import { addDays } from 'date-fns';

import { MembershipRole } from '~/lib/organizations/types/membership-role';
import { canInviteUser } from '~/lib/organizations/permissions';
import { MembershipInvite } from '~/lib/organizations/types/membership-invite';

import configuration from '~/configuration';
import { getUserInfoById } from '~/core/firebase/admin/auth/get-user-info-by-id';

import { getOrganizationById } from '../queries';
import logger from '~/core/logger';
import { getOrganizationsCollection } from '../collections';

import { sendEmail } from '~/lib/server/email/send-email';
interface Invite {
  email: string;
  role: MembershipRole;
  facilitator: string;
}

interface Params {
  organizationId: string;
  teamId: string;
  inviterId: string;
  invites: Invite[];
}

// change this constant to set a different amount of days
// for the invite to expire
const INVITE_EXPIRATION_DAYS = 1;

export async function inviteMembers(params: Params) {
  const { organizationId, invites, inviterId, teamId } = params;

  const inviter = await getUserInfoById(inviterId);
  const organization = await getOrganizationById(organizationId);
  const organizationData = organization.data();

  if (!organizationData) {
    throw new Error(
      `Organization data with ID ${organizationId} was not found`,
    );
  }

  const organizationName = organizationData.name;
  const inviterRole = organizationData?.members[inviterId].role;

  // validate that the inviter is currently in the organization
  if (inviterRole === undefined) {
    throw new Error(
      `Invitee with ID ${inviterId} does not belong to the organization`,
    );
  }

  const invitesCollection = organization.ref.collection(`invites`);
  const organizationRef = getOrganizationsCollection().doc(organizationId);
  const requests: Array<Promise<unknown>> = [];

  const expiresAt = addDays(new Date(), INVITE_EXPIRATION_DAYS).getTime();

  for (const invite of invites) {
    const ref = invitesCollection.doc();

    // validate that the user has permissions
    // to invite the user based on their roles
    if (!canInviteUser(inviterRole, invite.role)) {
      return;
    }

    const inviterDisplayName =
      invite.facilitator ?? inviter?.email ?? undefined;

    const organizationLogo = organizationData?.logoURL ?? undefined;

    const sendEmailRequest = (code: string) =>
      sendNotificationEmail({
        invitedUserEmail: invite.email,
        inviteCode: code,
        organizationName,
        organizationLogo,
        inviter: inviterDisplayName,
        role: invite.role
      });

    const field: keyof MembershipInvite = 'email';
    const op = '==';

    const existingInvite = await invitesCollection
      .where(field, op, invite.email)
      .where('type', op, 'organization')
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

          // send email
          const docSnapshot = await doc.data();
          await sendEmailRequest(docSnapshot.code);
        } catch (e) {
          return catchCallback(e);
        }
      };

      // add a promise for each invite
      requests.push(request());
    } else {
      // otherwise, we create a new document with the invite
      const request = async () => {
        const data: MembershipInvite = {
          ...invite,
          code: ref.id,
          expiresAt,
          organization: {
            id: organizationId,
            name: organizationData?.name ?? '',
          },
          team: {
            id: teamId
          },
          created: new Date(),
          type: 'organization',
        };

        try {
          // add invite to the Firestore collection
          await invitesCollection.add(data);

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
  organizationLogo: Maybe<string>;
  inviter: Maybe<string>;
  role: number
}) {
  const { invitedUserEmail, inviteCode, organizationName, inviter, role } = props;

  const link = getInvitePageFullUrl(inviteCode);

  let data: any = {
    to: invitedUserEmail,
    subject: `${inviter} is Inviting you to Join ${organizationName}`,
    template: 'board invite email template',
    'v:names': invitedUserEmail,
    'v:facilitator': inviter,
    'v:retrospective': `${organizationName} ${role === MembershipRole.Admin ? 'as an Admin' : 'as a Member'}`,
    'v:invitation_code': link,
    'v:email': invitedUserEmail,
    'v:expiration': '14 days',
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

  return [siteUrl, 'auth', 'invite', inviteCode].join('/');
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
