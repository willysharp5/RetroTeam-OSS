import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';
import { getOrganizationsCollection } from '~/lib/server/collections';

/**
 * @name detatchComment
 * @description Hook to detatch an comment by ID
 */

interface Params {
  organization: string;
  retrospectiveId: string;
  commentId: string;
  groupId: string;
}

export async function detatchComment({
  organization,
  retrospectiveId,
  commentId,
  groupId,
}: Params) {
  try {
    const firestore = getRestFirestore();
    const batch = firestore.batch();
    const commentRef = getOrganizationsCollection()
      .doc(organization)
      .collection('board')
      .doc(retrospectiveId)
      .collection('comments')
      .doc(commentId);
    const groupRef = getOrganizationsCollection()
      .doc(organization)
      .collection('board')
      .doc(retrospectiveId)
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
