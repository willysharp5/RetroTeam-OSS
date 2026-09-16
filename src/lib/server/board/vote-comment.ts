import {
  getOrganizationsCollection,
  getUsersCollection,
} from '~/lib/server/collections';
import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';

interface Params {
  id: string | any;
  organization: string;
  retrospectiveId: string;
  userId: string;
  userVotes: number;
}

/**
 * @name voteComment
 * @description Hook to update an existing comment
 */

export async function voteComment({
  id,
  organization,
  retrospectiveId,
  userId,
  userVotes,
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
  const existingSnapshot = await commentRef.get();
  const existingData = existingSnapshot.data();
  try {
    if (existingData) {
      // If the voters already exists, update it by merging the existing comments with the new ones
      batch.update(commentRef, {
        voters: {
          ...(existingData.voters || {}),
          [userId]: {
            votes: userVotes,
          },
        },
      });
    } else {
      // If the votes does not exist, create it
      batch.create(commentRef, {
        voters: {
          [userId]: {
            votes: userVotes,
          },
        },
      });
    }

    await batch.commit();

    const updatedCommentDoc = await commentRef.get();
    if (updatedCommentDoc.exists) {
      const updatedActionData = updatedCommentDoc.data();

      //Get user Data
      if (updatedActionData?.author) {
        const user = await getUserData(updatedActionData.author);
        if (updatedActionData && user) updatedActionData.user = user;
      }

      return updatedActionData;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error', error);
    return null;
  }
}
