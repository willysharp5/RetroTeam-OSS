import { getOrganizationsCollection } from '~/lib/server/collections';

/**
 * @name deleteAction
 * @description Hook to delete an action by ID
 */

interface Params {
  id: string;
  organization: string;
  team: string;
}

export async function deleteAction({ id, organization, team }: Params) {
  try {
    const actionRef = getOrganizationsCollection()
      .doc(organization)
      .collection('teams')
      .doc(team)
      .collection('actions')
      .doc(id);

    const docSnapshot = await actionRef.get();
    if (docSnapshot.exists) {
      await actionRef.delete();
      return { success: true };
    } else {
      return {
        success: false,
        message: `Action with ID ${id} does not exist.`,
      };
    }
  } catch (error) {
    console.error('Error', error);
    return {
      success: false,
      message: 'An error occurred while deleting the action.',
    };
  }
}
