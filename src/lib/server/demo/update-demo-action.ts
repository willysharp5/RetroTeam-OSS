import { getDemoCollection } from '~/lib/server/collections';
import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';

interface ActionParams {
  id: string | any;
  description: string;
  assignee: string;
  date: any;
  order: number;
  author?: string;
  status?: string;
}

/**
 * @name updateDemoAction
 * @description Hook to update a demo action comment
 */
export async function updateDemoAction({
  id,
  description,
  assignee,
  order,
  date,
  status,
}: ActionParams) {

  const firestore = getRestFirestore();
  const batch = firestore.batch();

  const actionRef = getDemoCollection()
    .doc('demo')
    .collection('actions')
    .doc(id);
  const actionData = await actionRef.get();
  const oldActionData = actionData.data();

  try {
    batch.update(actionRef, {
      description,
      assignee,
      order,
      date,
      status: status ? status : oldActionData?.status,
    });

    await batch.commit();

    const updatedActionDoc = await actionRef.get();
    if (updatedActionDoc.exists) {
      const updatedActionData = updatedActionDoc.data();

      return updatedActionData;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error on update board actions', error);
    return null;
  }
}