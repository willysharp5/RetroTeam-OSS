import { getTemplatesCollection } from '~/lib/server/collections';
import { Structure } from '~/lib/structures/types/structures';

import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';

interface Params {
  id: string;
  title: string;
  summary: string;
  structure: Structure[];
}

export async function createTemplates({
  id,
  title,
  summary,
  structure,
}: Params) {
  const firestore = getRestFirestore();
  const batch = firestore.batch();

  const templatesRef = getTemplatesCollection().doc(id);

  try {
    batch.create(templatesRef, {
      id,
      title,
      summary,
      structure,
    });

    await batch.commit();

    const snapshot = await templatesRef.get();
    const newData = snapshot.data();

    return newData;
  } catch (error) {
    console.error('Error', error);
  }
}
