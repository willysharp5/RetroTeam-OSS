import { getOrganizationsCollection } from '~/lib/server/collections';

/**
 * @name deleteTeam
 * @description Hook to delete a notification by ID
 */
interface Params {
  id: string;
  organizationId: string;
}

export async function deleteNotification({ organizationId, id }: Params) {
  try {
    const notificationRef = getOrganizationsCollection()
      .doc(organizationId)
      .collection('notifications')
      .doc(id);

    const docSnapshot = await notificationRef.get();
    if (docSnapshot.exists) {
      await notificationRef.delete();
      return { success: true };
    } else {
      return {
        success: false,
        message: `Notification with ID ${id} does not exist.`,
      };
    }
  } catch (error) {
    console.error('Error', error);
    return {
      success: false,
      message: 'An error occurred while deleting the notification.',
    };
  }
}
