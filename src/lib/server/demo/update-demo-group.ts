import { getDemoCollection, getOrganizationsCollection } from '~/lib/server/collections';
import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';
import { Tag } from '~/lib/board/types/types';

interface Params {
    id: string;
    name: string;
    status: string;
    order: number;
    tags?: Tag[];
    votes?: number
}

/**
 * @name UpdateGroup
 * @description Hook to update a group
 */

export async function UpdateDemoGroup({
    id,
    name,
    status,
    order,
    tags,
    votes
}: Params) {
    const firestore = getRestFirestore();
    const batch = firestore.batch();
    const groupRef = getDemoCollection()
        .doc('demo')
        .collection('groups')
        .doc(id);

    try {
        const updateData = {
            name,
            status,
            order,
            tags: tags ? tags : [],
            ...(votes !== undefined && { votes })
        } as any;


        batch.update(groupRef, updateData);
        await batch.commit();

        const snapshot = await groupRef.get();
        const newData = snapshot.data();

        return newData;
    } catch (error) {
        console.error('Error updating grouping:', error);
    }
}
