import { getUsersCollection } from '~/lib/server/collections';
import { getUserRoleByOrganization } from '../organizations/memberships';
import { MembershipRole } from '~/lib/organizations/types/membership-role';

interface Params {
  id: string;
  name: string;
  lastName: string;
  organization: string;
  currentUserId: string;
}

export async function updateTeamMember({
  id,
  name,
  lastName,
  organization,
  currentUserId,
}: Params) {
  const myUserRole = await getUserRoleByOrganization({
    userId: currentUserId,
    organizationId: organization
  });

  if (id === currentUserId || myUserRole === MembershipRole.Admin) {
    //Update member name
    try {
      const MemberRef = getUsersCollection().doc(id);

      const MemberSnapshot = await MemberRef.get();
      if (!MemberSnapshot.exists) {
      }

      const searchableName = (name + lastName).replace(' ', '').toLowerCase();

      await MemberRef.update({
        name: name,
        lastName: lastName,
        fullName: name + ' ' + lastName,
        searchableName,
        searchableLastName: lastName.toLowerCase(),
        createdAt: new Date().getTime(),
      });

      return { success: true };
    } catch (error) {
      console.error('Update Team Member Error', error);
    }
  } else {
    return {
      success: false,
      message: `You don't have permissions to perform this action`,
    };
  }
}
