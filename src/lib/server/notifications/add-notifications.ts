import { getOrganizationsCollection } from '~/lib/server/collections';

import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';

interface Params {
  category: string;
  email: string;
  organization: string;
  retrospectiveId: string;
  teamId: string;
  subtitle: string;
  title: string;
  type: string;
}

export async function createNotifications({
  category,
  email,
  organization,
  retrospectiveId,
  teamId,
  subtitle,
  title,
  type,
}: Params) {
  const firestore = getRestFirestore();
  const batch = firestore.batch();

  const notificationssRef = getOrganizationsCollection()
    .doc(organization)
    .collection('notifications')
    .doc() as any;

  try {
    batch.create(notificationssRef, {
      id: notificationssRef.id,
      category,
      email,
      information: {
        organization,
        retrospectiveId,
        teamId,
      },
      subtitle,
      title,
      type,
      created: new Date(),
      seen: false,
    });

    await batch.commit();

    const snapshot = await notificationssRef.get();
    const newData = snapshot.data();

    return newData;
  } catch (error) {
    console.error('Error', error);
  }
}
