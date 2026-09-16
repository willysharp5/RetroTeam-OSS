import {
  getOrganizationsCollection,
  getUsersCollection,
} from '~/lib/server/collections';
import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';

interface Params {
  id: string | any;
  description: string;
  assignee: string;
  status: string;
  order: number;
  organization: string;
  group: string;
  retrospectiveId: string;
  votes: any;
  deleteVotes: any;
}

/**
 * @name updateComment
 * @description Hook to update an existing comment
 */

export async function updateComment({
  id,
  description,
  assignee,
  organization,
  status,
  order,
  group,
  retrospectiveId,
  votes,
  deleteVotes,
}: Params) {
  const firestore = getRestFirestore();
  const batch = firestore.batch();

  const commentRef = getOrganizationsCollection()
    .doc(organization)
    .collection('board')
    .doc(retrospectiveId)
    .collection('comments')
    .doc(id);

  const getUserData = async (userId: string) => {
    const userRef = getUsersCollection().doc(userId);
    const snapshot = await userRef.get();

    const newData = snapshot.data();
    return newData;
  };

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

      //Get user Data
      const user = await getUserData(updatedActionData?.author);
      if (updatedActionData && user) updatedActionData.user = user;

      return updatedActionData;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error', error);
    return null;
  }
}
