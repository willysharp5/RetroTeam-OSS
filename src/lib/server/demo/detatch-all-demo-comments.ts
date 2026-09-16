import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';
import { Group } from '~/lib/board/types/types';
import { getDemoCollection } from '~/lib/server/collections';

/**
 * @name detachAllDemoComments
 * @description Detaches all comments associated with a group in a retrospective and deletes the group.
 * @param {string} groupId - The group ID.
 * @returns {Promise<{ success: boolean; message?: string }>} - The result of the operation.
 */

interface Params {
    groupId: string;
}

export async function detachAllDemoComments({
    groupId,
}: Params): Promise<{ success: boolean; message?: string }> {
    try {

        const firestore = getRestFirestore();
        const batch = firestore.batch();


        const groupRef = getDemoCollection()
            .doc('demo')
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

        // References to comments and group collections
        const commentsRef = getDemoCollection()
            .doc('demo')
            .collection('comments')
            .where('group', '==', groupId);

        const querySnapshot = await commentsRef.get();

        querySnapshot.forEach((doc) => {
            batch.update(doc.ref, { group: '' });
        });

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
