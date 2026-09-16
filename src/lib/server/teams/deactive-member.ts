import { getOrganizationsCollection } from '~/lib/server/collections';
import configuration from '~/configuration';
import { getUserRoleByOrganization } from '../organizations/memberships';
import { Organization } from '~/lib/organizations/types/organization';
import { FieldValue } from 'firebase-admin/firestore';
import { Notification } from '~/lib/notifications/types/types';
import { MembershipRole } from '~/lib/organizations/types/membership-role';

import { sendEmail } from '~/lib/server/email/send-email';
function sendNotificationEmail(props: {
  removedUserName: string;
  removedUserEmail: string;
  organizationName: string;
  teamName: string;
  adminName: string;
  teamId: string;
}) {
  const {
    removedUserName,
    removedUserEmail,
    organizationName,
    teamName,
    adminName,
  } = props;

  const link = getInvitePageFullUrl();

  let data: any = {
    to: removedUserEmail,
    subject: `${adminName} is removing you from ${teamName} of  ${organizationName}`,
    template: 'removed/added team message',
    'v:names': removedUserName,
    'v:type': 'removed',
    'v:teamName': teamName,
    'v:adminName': adminName,
    'v:organizationName': organizationName,
    'v:url': link,
    'v:email': removedUserEmail,
  };

  void sendEmail(data);
}
/**
 * @name deactiveMemberTeam
 * @description Hook to deactivate team member by ID
 */

interface Params {
  organization: string;
  teamId: string;
  userId: string;
  removedUserName: string;
  removedUserEmail: string;
  organizationName: string;
  teamName: string;
  adminName: string;
  currentUserId: string | any;
}


export async function deactiveMemberTeam({
  organization,
  teamId,
  userId,
  removedUserName,
  removedUserEmail,
  organizationName,
  teamName,
  adminName,
  currentUserId,
}: Params) {

  const usersCollection = getOrganizationsCollection()
    .doc(organization)
    .collection('teams')
    .doc(teamId)
    .collection('users');

  const querySnapshot = await usersCollection.where('role', '==', 1).get();

  const myUserRole = await getUserRoleByOrganization({
    userId: currentUserId,
    organizationId: organization,
  });

  const deactiveUserRole = await getUserRoleByOrganization({
    userId: userId,
    organizationId: organization,
  });

  const sendEmailRequest = () =>
    sendNotificationEmail({
      removedUserName,
      removedUserEmail,
      organizationName,
      teamName,
      adminName,
      teamId: teamId,
    });

  if (myUserRole === MembershipRole.Admin) {

    if (deactiveUserRole === MembershipRole.Admin && querySnapshot.size < 2) {
      return { success: false, message: 'There is only one admin' };
    } else {
      try {
        const memberRef = getOrganizationsCollection()
          .doc(organization)
          .collection('teams')
          .doc(teamId)
          .collection('users')
          .doc(userId);
        const docSnapshot = await memberRef.get();

        const teamRef = getOrganizationsCollection()
          .doc(organization)
          .collection('teams')
          .doc(teamId);

        const retrospectivesCollectionPath = getOrganizationsCollection()
          .doc(organization)
          .collection('teams')
          .doc(teamId)
          .collection('retrospectives');

        const notificationsCollection = getOrganizationsCollection()
          .doc(organization)
          .collection('notifications');
        const notificationDocRef = notificationsCollection.doc(); // Esto crea un nuevo documento con un ID único

        const memberPath = getMemberPath(userId);

        if (docSnapshot.exists) {
          await memberRef.update({ active: false });

          // Delete member from retrospective team
          const retrospectiveQuerySnapshot = await retrospectivesCollectionPath
            .where('access.type', '==', 'team')
            .get();

          for (const retrospectiveDoc of retrospectiveQuerySnapshot.docs) {
            const commentsCollectionPath = getOrganizationsCollection()
              .doc(organization)
              .collection('board')
              .doc(retrospectiveDoc.id)
              .collection('comments');

            await retrospectiveDoc.ref.update({
              [memberPath]: FieldValue.delete(),
            });

            // Update comments assignees
            const commentsQuerySnapshot = await commentsCollectionPath
              .where('team', '==', teamId)
              .get();

            for (const commentDoc of commentsQuerySnapshot.docs) {
              const commentsData = commentDoc.data();
              if (commentsData.assignee === userId) {
                // Update comments
                await commentDoc.ref.update({
                  assignee: '',
                });
              }
            }
          }

          // Deactivate member from team
          await teamRef.update({
            [memberPath]: FieldValue.delete(),
          });

          const notificationData: Notification = {
            title: 'Removed',
            created: new Date(),
            category: 'removed',
            type: 'team',
            subtitle: `<p>You have been removed from <b>${organizationName} - ${teamName}</b> by <b>${adminName}</b> </p>`,
            information: {
              organizationId: organization,
              teamId: teamId,
              retrospectiveId: '',
            },
            email: removedUserEmail,
            id: notificationDocRef.id,
            seen: false,
          };

          await notificationDocRef.set(notificationData);

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
          message: 'An error occurred while deactivating the team member.',
        };
      }
    }
  } else {
    return {
      success: false,
      message: `You don't have permission to deactivate users`,
    };
  }
}

function getMemberPath(userId: string) {
  const membersPropertyKey: keyof Organization = 'members';

  return `${membersPropertyKey}.${userId}`;
}

/*
 * @name getInvitePageFullUrl
 * @description Return the full URL to the invite page link.
 */
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
