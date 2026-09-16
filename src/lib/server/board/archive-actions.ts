import { getOrganizationsCollection } from '~/lib/server/collections';
import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';
import { getUserRefById } from '../queries';

interface ActionParams {
  id: string | any;
  archive: boolean;
  organization: string;
  retrospectiveId: string;
}

/**
 * @name archiveAction
 * @description Hook to archive a board action
 */
export async function archiveAction({
  id,
  archive,
  organization,
  retrospectiveId,
}: ActionParams) {
  const firestore = getRestFirestore();
  const batch = firestore.batch();

  const actionRef = getOrganizationsCollection()
    .doc(organization)
    .collection('board')
    .doc(retrospectiveId)
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

      // Get user Data
      const user = await getUserRefById(updatedActionData?.author);

      if (updatedActionData && user) updatedActionData.user = user;

      return updatedActionData;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error on update board actions', error);
    return null;
  }
}
