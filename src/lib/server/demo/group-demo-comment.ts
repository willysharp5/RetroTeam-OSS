import { getDemoCollection } from '~/lib/server/collections';
import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';
import { DEMO_COLLECTION } from '~/lib/firestore-collections';

interface Params {
  id: string;
  comment: string;
  status: string;
  votes: number;
  voters: any;
}

/**
 * @name groupComment
 * @description Hook to group a demo comment
 */
export async function groupDemoComment({
  id,
  comment,
  status,
  votes,
  voters,
}: Params) {
  if (!id || !comment) {
    throw new Error('Missing required parameters');
  }

  const firestore = getRestFirestore();
  const batch = firestore.batch();
  const groupRef = getDemoCollection()
    .doc('demo')
    .collection('groups')
    .doc(id);

  const commentPath = `/${DEMO_COLLECTION}/${'demo'}/comments/${comment}`;
  const commentsReF = firestore.doc(commentPath);

  try {
    // Retrieve the comment data
    const commentsSnapshot = await commentsReF.get();
    const commentData = commentsSnapshot.exists ? commentsSnapshot.data() : null;

    if (!commentData) {
      console.error('Comment data not found');
      return { message: 'Comment data not found' };
    }

    // Retrieve the group data
    const groupSnapshot = await groupRef.get();
    if (!groupSnapshot.exists) {
      console.error('Group data not found');
      return { message: 'Group data not found' };
    }

    const existingData = groupSnapshot.data();

    if (existingData && commentData) {
      // Verify if the comment is already part of a group
      const comments = existingData.comments || {};

      if (comments[comment] || commentData.group !== '') {
        console.log('Comment is already grouped');
        return { message: 'Comment already grouped', group: existingData };
      }

      // Add the comment to the group
      batch.update(groupRef, {
        comments: {
          ...comments,
          [comment]: {
            ref: commentsReF,
            id: comment,
          },
        },
      });
    } else {
      // Create the group if it doesn't exist
      batch.create(groupRef, {
        id,
        name: '',
        status,
        comments: {
          [comment]: {
            ref: commentsReF,
            id: comment,
          },
        },
        votes,
        voters,
      });
    }

    // Commit the batch operation
    await batch.commit();

    // Retrieve the updated group data
    const snapshot = await groupRef.get();
    const newData = snapshot.data();

    return newData;
  } catch (error) {
    console.error('Error creating/updating grouping:', error);
    throw error;
  }
}
