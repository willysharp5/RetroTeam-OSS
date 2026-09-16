import { getOrganizationsCollection } from '~/lib/server/collections';
import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';
import { getUserRefById } from '../queries';

interface ActionParams {
  id: string | any;
  description: string;
  assignee: string;
  date: any;
  order: number;
  organization: string;
  team: string;
  retrospectiveId: string;
  author?: string;
  facilitator: string;
  status?: string;
}

/**
 * @name updateAction
 * @description Hook to update an action comment
 */
export async function updateAction({
  id,
  description,
  assignee,
  organization,
  order,
  retrospectiveId,
  date,
  facilitator,
  status,
}: ActionParams) {

  const firestore = getRestFirestore();
  const batch = firestore.batch();

  const actionRef = getOrganizationsCollection()
    .doc(organization)
    .collection('board')
    .doc(retrospectiveId)
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
      updatedBy: facilitator
    });

    await batch.commit();

    const updatedActionDoc = await actionRef.get();
    if (updatedActionDoc.exists) {
      const updatedActionData = updatedActionDoc.data();

      // Get user Data
      const user = await getUserRefById(updatedActionData?.author);

      if (updatedActionData && user) updatedActionData.user = user;

      return updatedActionData;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error on update board actions', error);
    return null;
  }
}

/**
 * @name updateAllActions
 * @description Updates all actions with the provided data
 */
export async function updateAllActions(
  actions: ActionParams[],
  retrospectiveId: string,
  organization: string,
  facilitator: string,
) {
  const updatedActions = [];
  let index = 0;

  for (const action of actions) {
    const body = {
      id: action.id,
      description: action.description,
      assignee: action.assignee,
      organization,
      order: index,
      retrospectiveId,
      date: action.date != '' ? action.date : null,
      facilitator,
      status: action.status,
      team: action.team,
    };

    const updatedAction = await updateAction(body);
    if (updatedAction) {
      updatedActions.push(updatedAction);
    }
    index++;
  }

  return updatedActions;
}
