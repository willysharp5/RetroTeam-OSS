import { getOrganizationsCollection } from '~/lib/server/collections';
import { getUserRoleByOrganization } from '../organizations/memberships';
import { MembershipRole } from '~/lib/organizations/types/membership-role';

/**
 * @name deleteTeam
 * @description Hook to delete an team by ID
 */
interface Params {
  id: string;
  organization: string;
  userId: string;
}

export async function deleteTeam({ organization, id, userId }: Params) {
  const myUserRole = await getUserRoleByOrganization({
    userId: userId,
    organizationId: organization
  }) as number;

  if (myUserRole === MembershipRole.Admin) {
    try {
      const teamRef = getOrganizationsCollection()
        .doc(organization)
        .collection('teams')
        .doc(id);

      const docSnapshot = await teamRef.get();
      if (docSnapshot.exists) {
        // Delete team document
        await teamRef.delete();

        // Delete team subcollections
        const subCollections = await teamRef.listCollections();
        for (const subCollection of subCollections) {
          const documents = await subCollection.listDocuments();
          for (const doc of documents) {
            await doc.delete();
          }
        }
        // Delete retrospecitves
        const retrospectivesRef = getOrganizationsCollection()
          .doc(organization)
          .collection('retrospectives')
          .where('team', '==', teamRef);
        const retrospectiveQuerySnapshot = await retrospectivesRef.get();
        if (retrospectiveQuerySnapshot.size > 0) {
          retrospectiveQuerySnapshot.forEach((doc) => {
            doc.ref.delete();
          });
        }

        //Delete boards
        const boardsRef = getOrganizationsCollection()
          .doc(organization)
          .collection('boards')
          .where('teamId', '==', id);
        const boardsQuerySnapshot = await boardsRef.get();
        if (boardsQuerySnapshot.size > 0) {
          boardsQuerySnapshot.forEach((doc) => {
            doc.ref.delete();
          });
        }

        return { success: true };
      } else {
        return {
          success: false,
          message: `Team with ID ${id} does not exist.`,
        };
      }
    } catch (error) {
      console.error('Error', error);
      return {
        success: false,
        message: 'An error occurred while deleting the team.',
      };
    }
  } else {
    return {
      success: false,
      message: `You don't have permission to delete this team`,
    };
  }
}
