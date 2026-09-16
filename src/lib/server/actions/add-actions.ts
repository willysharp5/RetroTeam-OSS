import { getOrganizationsCollection } from '~/lib/server/collections';
import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';
import { getUserRefById } from '../queries';

interface Params {
  id: string;
  description: string;
  assignee: string;
  date: any;
  organization: string;
  status: string;
  archive: boolean;
  order: number;
  team: string;
  author: string;
}

/**
 * @name createActions
 * @description Hook to create a new actions
 */

export async function createActions({
  id,
  description,
  assignee,
  date,
  organization,
  status,
  order,
  team,
  author,
}: Params) {
  const firestore = getRestFirestore();
  const batch = firestore.batch();
  const actionRef = getOrganizationsCollection()
    .doc(organization)
    .collection('teams')
    .doc(team)
    .collection('actions')
    .doc(id);
  const dateFieldValue = !isNaN(date) ? null : new Date(date);
  try {
    if (assignee != '') {
      const ref = await getUserRefById(assignee);
      const userData = ref.data();

      const facilitatoRef = await getUserRefById(author);
      const facilitator = facilitatoRef.data();

      const notificationRef = getOrganizationsCollection()
        .doc(organization)
        .collection('notifications')
        .doc();
      const notificationData = {
        title: 'Added',
        created: new Date(),
        category: 'added',
        type: 'actions',
        subtitle: `<p>You have been added to an <a href="/dashboard?myActions=true" class="text-blue-500 underline"><b>organization</b></a> Action by <b>${facilitator?.fullName}</b> </p>`,
        information: {
          organization,
          teamId: team,
          retrospectiveId: '',
        },
        email: userData?.email,
        id: notificationRef.id,
        seen: false,
      };
      await notificationRef.set(notificationData);
    }

    batch.create(actionRef, {
      id,
      description,
      assignee,
      created: new Date(),
      date: dateFieldValue,
      status,
      organization,
      archive: false,
      order,
      team,
      author,
    });

    await batch.commit();

    const snapshot = await actionRef.get();
    const newData = snapshot.data();

    return newData;
  } catch (error) {
    console.error('Error', error);
  }
}
