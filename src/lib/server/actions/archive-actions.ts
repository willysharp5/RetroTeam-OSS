import { getOrganizationsCollection } from '../collections';
import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';
interface Params {
  id: string;
  organization: string;
  archive: boolean;
  team: string;
}

/**
 * @name archiveActions
 * @description Hook to archive an existing action
 */

export async function archiveActions({
  id,
  organization,
  archive,
  team,
}: Params) {
  const firestore = getRestFirestore();
  const batch = firestore.batch();
  const actionRef = getOrganizationsCollection()
    .doc(organization)
    .collection('teams')
    .doc(team)
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
    console.error('Error', error);
    return null;
  }
}
