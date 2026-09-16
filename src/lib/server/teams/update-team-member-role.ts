import configuration from '~/configuration';
import {
  getOrganizationsCollection,
} from '~/lib/server/collections';

import { Notification } from '~/lib/notifications/types/types';
import { getUserRoleByOrganization } from '../organizations/memberships';
import { MembershipRole } from '~/lib/organizations/types/membership-role';

import { sendEmail } from '~/lib/server/email/send-email';
interface Params {
  id: string;
  name: string;
  lastName: string;
  email: string;
  newRole: string;
  teamId: string;
  teamName: string;
  organization: string;
  organizationName: string;
  adminName: string;
  currentUserId: string;
}

function sendNotificationEmail(props: {
  updatedUserName: string;
  updatedUserEmail: string;
  organizationName: string;
  teamName: string;
  adminName: string;
  newRole: string;
  oldRole: number;
  teamId: string;
}) {
  const {
    updatedUserName,
    updatedUserEmail,
    organizationName,
    teamName,
    adminName,
    newRole,
    oldRole,
    teamId,
  } = props;

  function assertSiteUrl(siteUrl: Maybe<string>): asserts siteUrl is string {
    if (!siteUrl && configuration.production) {
      throw new Error(
        `Please configure the "siteUrl" property in the configuration file ~/configuration.ts`,
      );
    }
  }

  function getInvitePageFullUrl() {
    let siteUrl = configuration.site.siteUrl;

    assertSiteUrl(siteUrl);

    return [siteUrl, 'settings', 'teams', teamId].join('/');
  }

  const oldRoleName = getSelectedRoleModel(oldRole);
  const newRoleName = getSelectedRoleModel(parseInt(newRole));
  const url = getInvitePageFullUrl();

  let data: any = {
    to: updatedUserEmail,
    subject: `${adminName} has updated your role from ${teamName} of ${organizationName}`,
    template: 'Member Announcements',
    'v:names': 'Hey ' + updatedUserName + ' !',
    'v:message': `<p style="text-align: center;">Your <b>role</b> in Team - ${teamName} was updated<br/><br/> by Facilitator ${adminName} of <br/><br/> ${organizationName} <b>from ${oldRoleName} to <br/><br/> ${newRoleName}</b></p>`,
    'v:url': url,
    'v:email': updatedUserEmail,
    'v:buttonTitle': 'Go to RetroTeam Settings',
  };

  void sendEmail(data);
}


export async function updateTeamMemberRole({
  id,
  name,
  lastName,
  email,
  teamId,
  teamName,
  newRole,
  organization,
  organizationName,
  adminName,
  currentUserId,
}: Params) {
  const sendEmailRequest = (oldRole: number) =>
    sendNotificationEmail({
      updatedUserName: name + ' ' + lastName,
      updatedUserEmail: email,
      organizationName: organizationName,
      teamName: teamName,
      adminName: adminName,
      newRole: newRole,
      oldRole: oldRole,
      teamId: teamId,
    });

  const myUserRole = await getUserRoleByOrganization({
    userId: currentUserId,
    organizationId: organization
  }) as number;

  const usersCollection = getOrganizationsCollection()
    .doc(organization)
    .collection('teams')
    .doc(teamId)
    .collection('users');

  const querySnapshot = await usersCollection.where('role', '==', 1).get();

  if (myUserRole === MembershipRole.Admin) {
    //Update member role
    try {
      const teamRef = getOrganizationsCollection()
        .doc(organization)
        .collection('teams')
        .doc(teamId);

      const notificationRef = getOrganizationsCollection()
        .doc(organization)
        .collection('notifications')
        .doc();

      const teamSnapshot = await teamRef.get();
      if (!teamSnapshot.exists) {
      }
      const teamData = teamSnapshot.data();
      if (newRole !== '') {
        const usersRef = teamRef.collection('users');
        const AdminDoc = await usersRef.doc(id).get();

        if (AdminDoc.exists) {
          const oldRole = AdminDoc?.data()?.role;
          const oldRoleName = getSelectedRoleModel(oldRole);
          const newRoleName = getSelectedRoleModel(parseInt(newRole));

          if (oldRole !== parseInt(newRole)) {
            if (oldRole === 1 && querySnapshot.size <= 1) {
              return { success: false, message: 'There is only one admin' };
            } else {
              if (oldRole !== parseInt(newRole)) {
                await AdminDoc.ref.update({
                  role: parseInt(newRole),
                });

                const notificationData: Notification = {
                  title: 'Updated',
                  created: new Date(),
                  category: 'updated',
                  type: 'team',
                  subtitle: `<p>Your role has been updated from <b>${oldRoleName}</b> to <b>${newRoleName}</b> by <b>${adminName}</b> in <b>${teamData?.name}<b/></p>`,
                  information: {
                    organizationId: organization,
                    teamId: teamId,
                    retrospectiveId: '',
                  },
                  email: email,
                  id: notificationRef.id,
                  seen: false,
                };
                await notificationRef.set(notificationData);
                await sendEmailRequest(oldRole);
              }
            }
          }
        } else {
          console.error('User not exist');
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Update Team Member Role Error', error);
    }
  } else {
    return {
      success: false,
      message: `You don't have permissions to perform this action`,
    };
  }
}

function getSelectedRoleModel(currentRole: any) {
  if (currentRole === 0) {
    return 'Member';
  } else if (currentRole === 1) {
    return 'Admin';
  }
}
