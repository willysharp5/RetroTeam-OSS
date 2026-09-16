import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';
import { Group } from '~/lib/board/types/types';
import { getOrganizationsCollection } from '~/lib/server/collections';

/**
 * @name detachAllComments
 * @description Detaches all comments associated with a group in a retrospective and deletes the group.
 * @param {string} organization - The organization ID.
 * @param {string} retrospectiveId - The retrospective ID.
 * @param {string} groupId - The group ID.
 * @returns {Promise<{ success: boolean; message?: string }>} - The result of the operation.
 */

interface Params {
  organization: string;
  retrospectiveId: string;
  groupId: string;
}

export async function detachAllComments({
  organization,
  retrospectiveId,
  groupId,
}: Params): Promise<{ success: boolean; message?: string }> {
  try {

    const firestore = getRestFirestore();
    const batch = firestore.batch();

    // References to comments and group collections
    const commentsRef = getOrganizationsCollection()
      .doc(organization)
      .collection('board')
      .doc(retrospectiveId)
      .collection('comments');

    const groupRef = getOrganizationsCollection()
      .doc(organization)
      .collection('board')
      .doc(retrospectiveId)
      .collection('groups')
      .doc(groupId);

    // Get all comments linked to the group
    const groupSnapshot = await groupRef
      .get();

    const groupData = groupSnapshot.data() as Group;

    // Get all comments linked to the group
    if (groupData) {
      const mappedComments = Object.entries(groupData.comments).map(([key, value]) => ({
        key,
        ...value,
      }));

      mappedComments.forEach((doc: any) => {
        batch.update(doc.ref, { group: '', status: groupData.status });
      });
    }

    // Delete the group document
    batch.delete(groupRef);

    // Commit the batch operation
    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error('Error detaching comments and deleting group:', error);
    return {
      success: false,
      message: 'An error occurred while detaching the comments and deleting the group.',
    };
  }
}
