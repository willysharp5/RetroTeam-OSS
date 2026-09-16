import { getBoardCollection, getOrganizationsCollection } from '../collections';

/**
 * @name getBoardByRetrospective
 * @description Returns the Firestore reference of the board by its retrospective ID
 * {@link organizationId}
 * @param organizationId
 * @param retrospectiveId
 */
export async function getBoardByRetrospective(
  organizationId: string,
  retrospectiveId: string,
) {
  const board = getBoardCollection(organizationId);
  return board.doc(retrospectiveId).get();
}

export async function getBoardMembersByRetrospective(
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
