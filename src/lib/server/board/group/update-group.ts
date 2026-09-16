import { getOrganizationsCollection } from '~/lib/server/collections';
import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';
import { Tag } from '~/lib/board/types/types';

interface Params {
  id: string;
  name: string;
  organization: string;
  retrospectiveId: string;
  status: string;
  order: number;
  tags?: Tag[];
  aiGroup?: boolean;
}

/**
 * @name UpdateGroup
 * @description Hook to update a group
 */

export async function UpdateGroup({
  id,
  name,
  organization,
  retrospectiveId,
  status,
  order,
  tags,
  aiGroup,
}: Params) {
  const firestore = getRestFirestore();
  const batch = firestore.batch();
  const groupRef = getOrganizationsCollection()
    .doc(organization)
    .collection('board')
    .doc(retrospectiveId)
    .collection('groups')
    .doc(id);

  try {
    const updateData = {
      name,
      status,
      order,
      tags: tags ? tags : [],
    } as any;

    if (typeof aiGroup !== 'undefined') {
      updateData.aiGroup = aiGroup;
    }

    batch.update(groupRef, updateData);
    await batch.commit();

    const snapshot = await groupRef.get();
    const newData = snapshot.data();

    return newData;
  } catch (error) {
    console.error('Error updating grouping:', error);
  }
}
