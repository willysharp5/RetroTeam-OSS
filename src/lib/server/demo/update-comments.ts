import {
    getDemoCollection,
  getUsersCollection,
} from '~/lib/server/collections';
import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';

interface Params {
  id: string | any;
  description: string;
  assignee: string;
  status: string;
  order: number;
  group: string;
  votes: any;
  deleteVotes: any;
}

/**
 * @name updateDemoComment
 * @description Hook to update an existing demo comment
 */

export async function updateDemoComment({
  id,
  description,
  assignee,
  status,
  order,
  group,
  votes,
  deleteVotes,
}: Params) {
  const firestore = getRestFirestore();
  const batch = firestore.batch();

  const commentRef = getDemoCollection()
    .doc('demo')
    .collection('comments')
    .doc(id);

  try {
    if (deleteVotes === true) {
      batch.update(commentRef, {
        voters: [],
      });
    }
    batch.update(commentRef, {
      description,
      assignee,
      status,
      order,
      group,
      votes,
    });

    await batch.commit();

    const updatedCommentDoc = await commentRef.get();
    if (updatedCommentDoc.exists) {
      const updatedActionData = updatedCommentDoc.data();
      return updatedActionData;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error', error);
    return null;
  }
}
