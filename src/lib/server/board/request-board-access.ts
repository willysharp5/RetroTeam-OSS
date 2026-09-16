import { getOrganizationsCollection } from '~/lib/server/collections';
import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';
import { USERS_COLLECTION } from '~/lib/firestore-collections';

interface Params {
  id: string;
  userId: string;
  organization: string;
}

/**
 * @name requestBoardAccess
 * @description Hook to request access to a board
 */

export async function requestBoardAccess({ id, organization, userId }: Params) {
  const firestore = getRestFirestore();
  const batch = firestore.batch();
  const requestRef = getOrganizationsCollection()
    .doc(organization)
    .collection('board')
    .doc(id)
    .collection('requests')
    .doc(userId);
  const userPath = `/${USERS_COLLECTION}/${userId}`;
  const userRef = firestore.doc(userPath);
  try {
    batch.create(requestRef, {
      id,
      organization,
      status: 'pending',
      userId,
      userRef,
    });

    await batch.commit();

    const snapshot = await requestRef.get();
    const newData = snapshot.data();
    return newData;
  } catch (error) {
    console.error('Error', error);
    return null;
  }
}
