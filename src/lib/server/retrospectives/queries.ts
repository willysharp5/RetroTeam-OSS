import { getOrganizationsCollection, getTeamCollection } from '../collections';

/**
 * @name getRetrospectiveById
 * @description Returns the Firestore reference of the retrospective by its ID
 * {@link organizationId}
 * @param organizationId
 * @param teamId
 * @param retrospectiveId
 */
export async function getRetrospectiveById(
  organizationId: string,
  teamId: string,
  retrospectiveId: string,
) {
  const organization = getOrganizationsCollection();
  return organization
    .doc(organizationId)
    .collection('retrospectives')
    .doc(retrospectiveId)
    .get();
}
