import {
  getOrganizationsCollection,
} from '~/lib/server/collections';

import { getUserRoleByOrganization } from '../organizations/memberships';
import { MembershipRole } from '~/lib/organizations/types/membership-role';

interface Params {
  id: string;
  name: string;
  organization: string;
  userId: string;
}

export async function updateTeam({
  id,
  name,
  organization,
  userId,
}: Params) {

  const myUserRole = await getUserRoleByOrganization({
    userId: userId,
    organizationId: organization
  });

  if (myUserRole === MembershipRole.Admin) {
    try {
      const teamRef = getOrganizationsCollection()
        .doc(organization)
        .collection('teams')
        .doc(id);

      const teamSnapshot = await teamRef.get();
      if (!teamSnapshot.exists) {
        return { success: false };
      }

      const searchableName = name.replace(' ', '').toLowerCase();
      await teamRef.update({
        name: name,
        searchableName,
      });

      return { success: true };
    } catch (error) {
      console.error('Update Team Error', error);
      return { success: false, message: error };
    }
  } else {
    return {
      success: false,
      message: `You don't have permission to edit this team`,
    };
  }
}
