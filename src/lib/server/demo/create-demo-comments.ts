import { getDemoCollection } from '~/lib/server/collections';
import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';

interface Params {
    id: string;
    description: string;
    assignee: string;
    status: string;
    order: number;
    author?: string;
    group?: string;
}

/**
 * @name createDemoComments
 * @description Function to create a new comment
 */

export async function createDemoComments({
    id,
    description,
    assignee,
    status,
    order,
    author,
    group,
}: Params) {
    const firestore = getRestFirestore();
    const batch = firestore.batch();

    const commentRef = getDemoCollection().doc('demo').collection("comments").doc(id)

    try {
        batch.set(commentRef, {
            id,
            description,
            assignee,
            status,
            order,
            author,
            group,
            votes: 0,
            created: new Date(),
            voters: [],
        });

        await batch.commit();

        // Fetch the created document
        const snapshot = await commentRef.get();
        return snapshot.data();
    } catch (error) {
        console.error('Error creating comment:', error);
        throw error; // Ensure the error is propagated
    }
}
