import { getDemoCollection } from '~/lib/server/collections';
import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';

interface ActionParams {
  id: string | any;
  archive: boolean;
}

/**
 * @name archiveDemoAction
 * @description Hook to archive a board action
 */
export async function archiveDemoAction({
  id,
  archive,
}: ActionParams) {
  const firestore = getRestFirestore();
  const batch = firestore.batch();

  const actionRef = getDemoCollection()
    .doc('demo')
    .collection('actions')
    .doc(id);

  try {
    batch.update(actionRef, {
      archive,
    });

    await batch.commit();

    const updatedActionDoc = await actionRef.get();
    if (updatedActionDoc.exists) {
      const updatedActionData = updatedActionDoc.data();
      return updatedActionData;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error on update board actions', error);
    return null;
  }
}
