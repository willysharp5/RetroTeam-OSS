import { getOrganizationsCollection } from '~/lib/server/collections';

/**
 * @name deleteComment
 * @description Hook to delete an action by ID
 */

interface Params {
  organization: string;
  retrospectiveId: string;
  actionId: string;
}

export async function deleteAction({
  organization,
  retrospectiveId,
  actionId,
}: Params) {
  try {

    console.log("orga", organization, retrospectiveId, actionId)
    const actionRef = getOrganizationsCollection()
      .doc(organization)
      .collection('board')
      .doc(retrospectiveId)
      .collection('actions')
      .doc(actionId);

    const docSnapshot = await actionRef.get();
    if (docSnapshot.exists) {
      await actionRef.delete();
      return { success: true };
    } else {
      return {
        success: false,
        message: `Action with ID ${retrospectiveId} does not exist.`,
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
