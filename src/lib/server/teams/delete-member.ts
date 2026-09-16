import { getOrganizationsCollection } from '~/lib/server/collections';
import configuration from '~/configuration';
import { Organization } from '~/lib/organizations/types/organization';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { sendEmail } from '~/lib/server/email/send-email';
function sendNotificationEmail(props: {
  removedUserName: string;
  removedUserEmail: string;
  organizationName: string;
  teamName: string;
  adminName: string;
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
 * @name deleteMemberTeam
 * @description Hook to delete team member by ID
 */


export async function deleteMemberTeam({
  organization,
  teamId,
  userId,
  removedUserName,
  removedUserEmail,
  organizationName,
  teamName,
  adminName,
}: any) {
  const sendEmailRequest = () =>
    sendNotificationEmail({
      removedUserName,
      removedUserEmail,
      organizationName,
      teamName,
      adminName,
    });
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
    const retrospectivesCollectionPath = getOrganizationsCollection()
      .doc(organization)
      .collection('teams')
      .doc(teamId)
      .collection('retrospectives');

    const memberPath = getMemberPath(userId);

    const docSnapshot = await memberRef.get();

    if (docSnapshot.exists) {
      await memberRef.delete();

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

      // Delete member from team
      await teamRef.update({
        [memberPath]: FieldValue.delete(),
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
    console.error('Error deleting team member:', error);
    return {
      success: false,
      message: 'An error occurred while deleting the team member.',
      error: error,
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
