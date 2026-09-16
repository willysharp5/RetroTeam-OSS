import { getDemoCollection } from '~/lib/server/collections';
import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';

interface Params {
  id: string;
  description: string;
  assignee: string;
  date: any;
  order: number;
  author?: string;
  status: string;
}

/**
 * @name createDemoActions
 * @description Hook to create a new demo action
 */

export async function createDemoActions({
  id,
  description,
  assignee,
  date,
  order,
  author,
  status,
}: Params) {
  const firestore = getRestFirestore();
  const batch = firestore.batch();
  const actionRef = getDemoCollection()
    .doc('demo')
    .collection('actions')
    .doc(id);
  const dateFieldValue =
    date === undefined || date === '' ? null : new Date(date);

  try {
    batch.create(actionRef, {
      id,
      description,
      assignee,
      order,
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
