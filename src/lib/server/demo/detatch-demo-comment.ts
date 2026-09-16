import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';
import { getDemoCollection } from '~/lib/server/collections';

/**
 * @name detatchDemoComment
 * @description Hook to detatch an comment by ID
 */

interface Params {
  commentId: string;
  groupId: string;
}

export async function detatchDemoComment({
  commentId,
  groupId,
}: Params) {
  try {
    const firestore = getRestFirestore();
    const batch = firestore.batch();
    const commentRef = getDemoCollection()
      .doc('demo')
      .collection('comments')
      .doc(commentId);
    const groupRef = getDemoCollection()
      .doc('demo')
      .collection('groups')
      .doc(groupId);
    const docSnapshot = await commentRef.get();

    if (docSnapshot.exists) {
      if (groupId !== '') {
        const groupSnapshot = await groupRef.get();
        const existingComments = groupSnapshot.data()?.comments || {};
        const commentsLength = Object.keys(existingComments).length;

        delete existingComments[commentId];

        if (commentsLength === 1) {
          batch.delete(groupRef);
        } else {
          batch.update(groupRef, {
            comments: existingComments,
          });
        }

        await batch.commit();
        return { success: true };
      }
    } else {
      return {
        success: false,
        message: 'An error occurred while detaching the comments.',
      };
    }
  } catch (error) {
    console.error('Error', error);
    return {
      success: false,
      message: 'An error occurred while detaching the comments.',
    };
  }
}
