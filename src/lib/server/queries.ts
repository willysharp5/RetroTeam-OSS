import {
  getActionsCollection,
  getOrganizationsCollection,
  getUsersCollection,
} from './collections';

/**
 * @name getOrganizationById
 * @description Returns the Firestore reference of the organization by its ID
 * {@link organizationId}
 * @param organizationId
 */
export async function getOrganizationById(organizationId: string) {
  const organizations = getOrganizationsCollection();

  return organizations.doc(organizationId).get();
}

export async function getOrganizationMemberById(
  organizationId: string,
  userId: string,
) {
  const organizations = getOrganizationsCollection();

  return organizations
    .doc(organizationId)
    .collection('users')
    .doc(userId)
    .get();
}

export async function getTeamById(organizationId: string, teamId: string) {
  const organizations = getOrganizationsCollection();

  return organizations
    .doc(organizationId)
    .collection('teams')
    .doc(teamId)
    .get();
}

export async function getTeamMemberById(
  organizationId: string,
  teamId: string,
  userId: string,
) {
  const organizations = getOrganizationsCollection();

  return organizations
    .doc(organizationId)
    .collection('teams')
    .doc(teamId)
    .collection('users')
    .doc(userId)
    .get();
}

export async function getRetrospectiveById(
  organizationId: string,
  retrospectiveId: string,
) {
  const organizations = getOrganizationsCollection();

  return organizations
    .doc(organizationId)
    .collection('retrospectives')
    .doc(retrospectiveId)
    .get();
}
/**
 * @name getUserRefById
 * @description Returns the Firestore reference of the user by its ID {@link userId}
 * @param userId
 */
export async function getUserRefById(userId: string) {
  const users = getUsersCollection();

  return users.doc(userId).get();
}

/**
 * @description Fetch user Firestore object data (not auth!) by ID {@link userId}
 * @param userId
 */
export async function getUserData(userId: string) {
  const user = await getUserRefById(userId);
  const data = user.data();

  if (data) {
    return {
      ...data,
      id: user.id,
    };
  }
}

/**
 * @name getActionsByOrganization
 * @description Returns the Firestore reference of the actions by its organization
 * {@link actions}
 * @param actions
 */
export async function getActionsByOrganization(organizationId: string) {
  const actions = getActionsCollection();

  return actions.doc(organizationId).get();
}