import { getDemoCollection } from '~/lib/server/collections';
import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';
import { DEMO_COLLECTION } from '~/lib/firestore-collections';

interface Params {
    id: string;
    name: string;
    comments?: any[];
    status: string;
    votes: any;
    voters: any;
}

/**
 * @name groupComments
 * @description Hook to group a comment
 */

export async function groupDemoComments({
    id,
    name,
    comments,
    status,
    votes,
    voters,
}: Params) {
    const firestore = getRestFirestore();
    const batch = firestore.batch();
    const groupRef = getDemoCollection()
        .doc('demo')
        .collection('groups')
        .doc(id);

    const commentsRefs: any[] | undefined = comments?.map((comment) => {
        if (comment.group !== '') {
            const commentPath = `/${DEMO_COLLECTION}/${'demo'}/${'comments'}/${comment.id
                }`;

            return {
                ref: firestore.doc(commentPath),
                id: comment.id,
            };
        }
    }).filter(Boolean);

    try {
        batch.create(groupRef, {
            id,
            name,
            status,
            comments: commentsRefs?.reduce((map, comment) => {
                map[comment.id] = { ref: comment.ref, id: comment.id };
                return map;
            }, {}),
            order: -1,
            votes,
            created: new Date(),
            voters,
        });

        commentsRefs?.forEach((comment) => {
            batch.update(comment.ref, { group: id });
        });

        await batch.commit();

        const snapshot = await groupRef.get();
        const newData = snapshot.data();

        return newData;
    } catch (error) {
        console.error('Error creating grouping:', error);
        throw error;
    }
}
