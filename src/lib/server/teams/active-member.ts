import { getOrganizationsCollection } from '~/lib/server/collections';
import configuration from '~/configuration';
import { Organization } from '~/lib/organizations/types/organization';
import { USERS_COLLECTION } from '~/lib/firestore-collections';
import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';
import { getUserRoleByOrganization } from '../organizations/memberships';
import { MembershipRole } from '~/lib/organizations/types/membership-role';

import { sendEmail } from '~/lib/server/email/send-email';
function sendNotificationEmail(props: {
  removedUserName: string;
  activatedUserEmail: string;
  organizationName: string;
  teamName: string;
  adminName: string;
  teamId: string;
}) {
  const {
    removedUserName,
    activatedUserEmail,
    organizationName,
    teamName,
    adminName,
  } = props;

  const link = getInvitePageFullUrl();

  let data: any = {
    to: activatedUserEmail,
    subject: `${adminName} has reactivated you from ${teamName} of  ${organizationName}`,
    template: 'removed/added team message',
    'v:names': removedUserName,
    'v:type': 'reactivated',
    'v:teamName': teamName,
    'v:adminName': adminName,
    'v:organizationName': organizationName,
    'v:url': link,
    'v:email': activatedUserEmail,
  };


  void sendEmail(data);
}
/**
 * @name deleteAction
 * @description Hook to delete team member by ID
 */

interface Params {
  organization: string;
  teamId: string;
  userId: string;
  removedUserName: string;
  activatedUserEmail: string;
  organizationName: string;
  teamName: string;
  adminName: string;
  currentUserId: string | any;
}


export async function activeMemberTeam({
  organization,
  teamId,
  userId,
  removedUserName,
  activatedUserEmail,
  organizationName,
  teamName,
  adminName,
  currentUserId,
}: Params) {
  const firestore = getRestFirestore();

  const myUserRole = await getUserRoleByOrganization({
    userId: currentUserId,
    organizationId: organization,
  }) as number;

  const sendEmailRequest = () =>
    sendNotificationEmail({
      removedUserName,
      activatedUserEmail,
      organizationName,
      teamName,
      adminName,
      teamId: teamId,
    });

  if (myUserRole === MembershipRole.Admin) {
    try {
      const memberRef = getOrganizationsCollection()
        .doc(organization)
        .collection('teams')
        .doc(teamId)
        .collection('users')
        .doc(userId);
      const teamRef = getOrganizationsCollection()
        .doc(organization)
        .collection('teams')
        .doc(teamId);
      const userPath = `/${USERS_COLLECTION}/${userId}`;
      const userRef = firestore.doc(userPath);
      const docSnapshot = await memberRef.get();
      if (docSnapshot.exists) {
        await memberRef.update({ active: true });

        const memberPath = getMemberPath(userId);

        await teamRef.update({
          [memberPath]: {
            userId,
            user: userRef,
            active: true,
          },
        });

        await sendEmailRequest();

        return { success: true };
      } else {
        return {
          success: false,
          message: `Team Member with ID ${userId} does not exist.`,
        };
      }
    } catch (error) {
      console.error('Error', error);
      return {
        success: false,
        message: 'An error occurred while updating the team member.',
      };
    }
  } else {
    return {
      success: false,
      message: `You don't have permission to deactivate users`,
    };
  }
}

/*
 * @name getInvitePageFullUrl
 * @description Return the full URL to the invite page link. For example,
 * <your-site-url>/auth/invite/{INVITE_CODE}
 * @param url
 */

function getMemberPath(userId: string) {
  const membersPropertyKey: keyof Organization = 'members';

  return `${membersPropertyKey}.${userId}`;
}

function getInvitePageFullUrl() {
  let siteUrl = configuration.site.siteUrl;

  if (configuration.emulator) {
    siteUrl = getEmulatorHost();
  }

  assertSiteUrl(siteUrl);

  return [siteUrl, 'settings', 'teams'].join('/');
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
