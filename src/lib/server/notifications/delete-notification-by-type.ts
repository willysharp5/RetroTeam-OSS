import { firestore } from 'firebase-admin';
import { getOrganizationsCollection } from '../collections';

interface Params {
  organizationId: string;
  type: string;
  email: string;
}

export async function deleteNotificationsByType({
  organizationId,
  type,
  email,
}: Params) {
  try {
    const notificationsRef = getOrganizationsCollection()
      .doc(organizationId)
      .collection('notifications')
      .where('type', '==', type)
      .where('email', '==', email);

    const querySnapshot = await notificationsRef.get();
    const batch = firestore().batch();

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      if (data.category === 'invite') {
        if (data.accept) {
          batch.delete(doc.ref);
        }
      } else {
        batch.delete(doc.ref);
      }
    });

    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error('Error', error);
    return {
      success: false,
      message: 'An error occurred while deleting the notifications.',
    };
  }
}
