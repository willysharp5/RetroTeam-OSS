import { FieldValue } from 'firebase-admin/firestore';
import { TeamMembers } from '~/lib/teams/types/teams';
import { getOrganizationsCollection, getUsersCollection } from '../collections';
import configuration from '~/configuration';

import { sendEmail } from '~/lib/server/email/send-email';
interface Params {
  organizationId: string;
  teamId: string;
  retrospectiveId: string;
  members: TeamMembers[];
  activeMembers: TeamMembers[];
  boardName: string;
  facilitator: string;
  teamName: string;
}


export async function moveMembersFromRetrospective({
  organizationId,
  teamId,
  retrospectiveId,
  members,
  activeMembers,
  boardName,
  facilitator,
  teamName,
}: Params) {
  const batch = getOrganizationsCollection().firestore.batch();

  try {
    const retrospectiveRef = getOrganizationsCollection()
      .doc(organizationId)
      .collection('retrospectives')
      .doc(retrospectiveId);
    const retrospectiveSnapshot = await retrospectiveRef.get();

    if (!retrospectiveSnapshot.exists) {
      console.error('Retrospective document does not exist.');
      return {
        success: false,
        message: 'Retrospective document does not exist.',
      };
    }

    const sendEmailRequest = (email: string, userName: string) => {
      sendNotificationEmail({
        email,
        userName,
        boardName,
        facilitator,
        teamName,
        teamId,
      });
    };

    // Delete deactivated members from the board
    members.forEach((member) => {
      const memberPath = `members.${member.userId}`;
      batch.update(retrospectiveRef, { [memberPath]: FieldValue.delete() });

      const retrospectiveMemberRef = retrospectiveRef
        .collection('users')
        .doc(member.userId);
      batch.delete(retrospectiveMemberRef);
    });

    // Add missing activated members to the new team
    const teamRef = getOrganizationsCollection()
      .doc(organizationId)
      .collection('teams')
      .doc(teamId);

    if (activeMembers.length > 0) {
      const userPromises = activeMembers.map(async (member) => {
        const memberPath = `members.${member.userId}`;
        const userRef = getUsersCollection().doc(member.userId);

        batch.update(teamRef, {
          [memberPath]: {
            userId: member.userId,
            user: userRef,
          },
        });

        const teamMemberRef = teamRef.collection('users').doc(member.userId);
        batch.set(teamMemberRef, {
          user: userRef,
          userId: member.userId,
          active: true,
        });

        const userGet = userRef.get();
        const userData = (await userGet).data();
        sendEmailRequest(
          userData?.email as string,
          userData?.fullName as string,
        );
      });
      await Promise.all(userPromises);
    }

    // Fix retrospective from team
    batch.update(retrospectiveRef, { team: teamRef });

    await batch.commit();
    return {
      success: true,
      message: 'Retrospective members updated successfully.',
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      success: false,
      message: 'An error occurred while updating retrospective members.',
    };
  }
}

function sendNotificationEmail(props: {
  email: string;
  userName: string;
  boardName: string;
  teamName: string;
  facilitator: string;
  teamId: string;
}) {
  const { email, userName, boardName, teamName, facilitator, teamId } = props;

  const link = getTeamPageFullUrl(teamId);

  let data: any = {
    to: email,
    subject: `RetroTeam - Added to Board and Team`,
    template: 'Member Announcements',
    'v:names': 'RetroTeam - Added to Board and Team',
    'v:userName': userName,
    'v:boardName': boardName,
    'v:facilitator': facilitator,
    'v:teamName': teamName,
    'v:url': link,
    'v:email': email,
  };

  if (email) {
    void sendEmail(data);
  }
}

/*
 * @name getTeamPageFullUrl
 * @description Return the full URL to the invite page link. For example,
 * <your-site-url>/auth/invite/{INVITE_CODE}
 * @param inviteCode
 */
function getTeamPageFullUrl(teamId: string) {
  let siteUrl = configuration.site.siteUrl;
  assertSiteUrl(siteUrl);
  const url = [siteUrl, 'settings', 'teams', teamId].join('/');
  return url;
}

function assertSiteUrl(siteUrl: Maybe<string>): asserts siteUrl is string {
  if (!siteUrl && configuration.production) {
    throw new Error(
      `Please configure the "siteUrl" property in the configuration file ~/configuration.ts`,
    );
  }
}
