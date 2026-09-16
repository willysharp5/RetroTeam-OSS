import { getRetrospectivesCollection } from '~/lib/server/collections';
import { Access } from '~/lib/access/types/access';
import { Structure } from '~/lib/structures/types/structures';

import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';

interface Params {
  id: string;
  title: string;
  name: string;
  access: Access;
  date: any;
  icebreaker: boolean;
  structure: Structure[];
  organization: string;
  locked: boolean;
}

export async function createRetrospectives({
  id,
  title,
  name,
  access,
  date,
  icebreaker,
  structure,
  organization,
  locked,
}: Params) {
  const firestore = getRestFirestore();
  const batch = firestore.batch();

  const retrospectivesRef = getRetrospectivesCollection().doc(id) as any;
  const dateFieldValue = !isNaN(date) ? null : new Date(date);

  const searchableName = name.replace(' ', '').toLowerCase();

  try {
    batch.create(retrospectivesRef, {
      id,
      title,
      name,
      access,
      date: dateFieldValue,
      icebreaker,
      structure,
      organization,
      locked,
      finished: false,
      searchableName,
      allowMembersViewComments: false
    });

    await batch.commit();

    const snapshot = await retrospectivesRef.get();
    const newData = snapshot.data();

    return newData;
  } catch (error) {
    console.error('Error', error);
  }
}
