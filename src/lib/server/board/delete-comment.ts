import { getOrganizationsCollection } from '~/lib/server/collections';

/**
 * @name deleteComment
 * @description Hook to delete a comment by ID
 */

interface Params {
  organization: string;
  retrospectiveId: string;
  commentId: string;
}

export async function deleteComment({
  organization,
  retrospectiveId,
  commentId,
}: Params) {
  try {
    const commentRef = getOrganizationsCollection()
      .doc(organization)
      .collection('board')
      .doc(retrospectiveId)
      .collection('comments')
      .doc(commentId);

    const docSnapshot = await commentRef.get();
    if (!docSnapshot.exists) {
      return {
        success: false,
        message: `Comment with ID ${commentId} does not exist.`,
      };
    }

    const data = docSnapshot.data();
    const groupId = data?.group;
    if (groupId !== '') {
      const groupRef = getOrganizationsCollection()
        .doc(organization)
        .collection('board')
        .doc(retrospectiveId)
        .collection('groups')
        .doc(groupId);

      // Get the existing comments from the group
      const groupSnapshot = await groupRef.get();
      const existingComments = groupSnapshot.data()?.comments || {};

      // Remove the comment from the existing comments
      delete existingComments[commentId];

      if (Object.keys(existingComments).length === 0) {
        // If no comments left, delete the group
        await groupRef.delete();
      } else {
        // Update the group with the modified comments
        await groupRef.update({
          comments: existingComments,
        });
      }
    }

    await commentRef.delete();
    return { success: true };
  } catch (error) {
    console.error('Error', error);
    return {
      success: false,
      message: 'An error occurred while deleting the comment.',
    };
  }
}
