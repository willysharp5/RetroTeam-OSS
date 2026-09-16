import { getDemoCollection } from '~/lib/server/collections';

/**
 * @name deleteDemoAction
 * @description Hook to delete a demo action by ID
 */

interface Params {
  actionId: string;
}

export async function deleteDemoAction({
  actionId,
}: Params) {
  try {

    const actionRef = getDemoCollection()
      .doc('demo')
      .collection('actions')
      .doc(actionId);

    const docSnapshot = await actionRef.get();
    if (docSnapshot.exists) {
      await actionRef.delete();
      return { success: true };
    } else {
      return {
        success: false,
        message: `Action with ID ${actionId} does not exist.`,
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
