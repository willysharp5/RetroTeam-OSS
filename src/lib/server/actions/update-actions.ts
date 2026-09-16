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
  order: number;
  team: string;
  facilitator: string;
}

/**
 * @name updateActions
 * @description Hook to update an existing action
 */

export async function updateActions({
  id,
  description,
  assignee,
  date,
  organization,
  status,
  order,
  team,
  facilitator,
}: Params) {
  const facilitatorRef = await getUserRefById(facilitator);
  const facilitatorData = facilitatorRef.data();

  const firestore = getRestFirestore();
  const batch = firestore.batch();

  const actionRef = getOrganizationsCollection()
    .doc(organization)
    .collection('teams')
    .doc(team)
    .collection('actions')
    .doc(id);
  const actionData = await actionRef.get();
  const oldActionData = actionData.data();

  // Removed notification
  if (oldActionData?.assignee != '' && assignee != oldActionData?.assignee) {
    const ref = await getUserRefById(oldActionData?.assignee);
    const userData = ref.data();

    const notificationRef = getOrganizationsCollection()
      .doc(organization)
      .collection('notifications')
      .doc();
    const notificationData = {
      title: 'Remove',
      created: new Date(),
      category: 'remove',
      type: 'actions',
      subtitle: `<p>You have been removed from an <b>organization</b> Action by <b>${facilitatorData?.fullName}</b> </p>`,
      information: {
        organization,
        teamId: team,
        retrospectiveId: '',
      },
      email: userData?.email,
      id: notificationRef.id,
      seen: false,
    };
    await batch.set(notificationRef, notificationData);
  }

  // Added notification
  if (assignee != '' && assignee != oldActionData?.assignee) {
    const ref = await getUserRefById(assignee);
    const userData = ref.data();

    const notificationRef = getOrganizationsCollection()
      .doc(organization)
      .collection('notifications')
      .doc();
    const notificationData = {
      title: 'Added',
      created: new Date(),
      category: 'added',
      type: 'actions',
      subtitle: `<p>You have been added to an <a href="/dashboard?myActions=true" class="text-blue-500 underline"><b>organization</b></a> Action by <b>${facilitatorData?.fullName}</b> </p>`,
      information: {
        organization,
        teamId: '',
        retrospectiveId: '',
      },
      email: userData?.email,
      id: notificationRef.id,
      seen: false,
    };
    await batch.set(notificationRef, notificationData);
  }
  const dateFieldValue = !isNaN(date) ? null : new Date(date);
  try {
    batch.update(actionRef, {
      description,
      assignee,
      date: dateFieldValue,
      organization,
      status,
      order,
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
    console.error('Error', error);
    return null;
  }
}

interface jiraParams {
  id: string;
  url: string;
  organization: string;
  team: string;
  boardId?: string;
}

/**
 * @name updateJiraActions
 * @description Hook to update an existing action with JIRA fields
 */

export async function updateActionstoJira({
  id,
  url,
  organization,
  team,
  boardId
}: jiraParams) {

  const firestore = getRestFirestore();
  const batch = firestore.batch();

  let actionRef;
  if (boardId) {
    actionRef = getOrganizationsCollection()
      .doc(organization)
      .collection('board')
      .doc(boardId)
      .collection('actions')
      .doc(id);
  } else {
    actionRef = getOrganizationsCollection()
      .doc(organization)
      .collection('teams')
      .doc(team)
      .collection('actions')
      .doc(id);
  }

  try {
    batch.update(actionRef, {
      jiraURl: url,
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
    console.error('Error', error);
    return null;
  }
}
