import { getOrganizationsCollection } from '~/lib/server/collections';
import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';

interface Params {
  organization: string;
  retrospectiveId: string;
}

/**
 * @name createAiGrouping
 * @description Hook to update if the ai has been grouped on a retrospective
 */

export async function createAiGrouping({
  organization,
  retrospectiveId,
}: Params) {
  const firestore = getRestFirestore();
  const batch = firestore.batch();

  const retrospectiveRef = getOrganizationsCollection()
    .doc(organization)
    .collection('retrospectives')
    .doc(retrospectiveId)

  try {

    batch.update(retrospectiveRef, {
      aiGrouped: true
    });

    await batch.commit();

    const snapshot = await retrospectiveRef.get();
   const newData = snapshot.data();

    return newData;
  } catch (error) {
    console.error('Error on add-ai-gruping', error);
  }
}
