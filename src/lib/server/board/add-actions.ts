import { getOrganizationsCollection } from '~/lib/server/collections';
import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';

interface Params {
  id: string;
  description: string;
  assignee: string;
  date: any;
  order: number;
  organization: string;
  team: string;
  retrospectiveId: string;
  author?: string;
  status: string;
}

/**
 * @name createActions
 * @description Hook to create a new board action
 */

export async function createActions({
  id,
  description,
  assignee,
  organization,
  date,
  order,
  team,
  retrospectiveId,
  author,
  status,
}: Params) {
  const firestore = getRestFirestore();
  const batch = firestore.batch();
  const actionRef = getOrganizationsCollection()
    .doc(organization)
    .collection('board')
    .doc(retrospectiveId)
    .collection('actions')
    .doc(id);
  const dateFieldValue =
    date === undefined || date === '' ? null : new Date(date);

  try {
    batch.create(actionRef, {
      id,
      description,
      assignee,
      organization,
      order,
      team,
      author,
      date: dateFieldValue,
      created: new Date(),
      archive: false,
      status,
    });

    await batch.commit();

    const snapshot = await actionRef.get();
    const newData = snapshot.data();
    return newData;
  } catch (error) {
    console.error('Error', error);
  }
}
