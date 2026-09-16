import { getOrganizationsCollection } from '~/lib/server/collections';
import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';

interface Params {
  id: string;
  description: string;
  assignee: string;
  status: string;
  order: number;
  organization: string;
  team: string;
  retrospectiveId: string;
  author?: string;
  group?: string;
}

/**
 * @name createComments
 * @description Hook to create a new comment
 */

export async function createComments({
  id,
  description,
  assignee,
  organization,
  status,
  order,
  team,
  retrospectiveId,
  author,
  group,
}: Params) {
  const firestore = getRestFirestore();
  const batch = firestore.batch();
  const commentRef = getOrganizationsCollection()
    .doc(organization)
    .collection('board')
    .doc(retrospectiveId)
    .collection('comments')
    .doc(id);

  try {
    batch.create(commentRef, {
      id,
      description,
      assignee,
      status,
      organization,
      order,
      team,
      author,
      group,
      votes: 0,
      created: new Date(),
      voters: [],
    });

    await batch.commit();

    const snapshot = await commentRef.get();
    const newData = snapshot.data();

    return newData;
  } catch (error) {
    console.error('Error', error);
  }
}
