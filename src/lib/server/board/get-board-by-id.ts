import { getBoardCollection, getOrganizations } from '../collections';

export default async function getBoardById(boardId: string) {
  try {
    const organizationsSnapshot = await getOrganizations().get();
    const organizations = organizationsSnapshot.docs;

    const boardPromises = organizations.map(async (orgDoc) => {
      const boardCollectionRef = await getBoardCollection(orgDoc.id)
        .where('retrospectiveId', '==', boardId)
        .get();

      if (boardCollectionRef.empty) return null;

      const boardDoc = boardCollectionRef.docs[0];
      const teamId = boardDoc.data().teamId;
      const retrospectiveRef = boardDoc.data().retrospectiveRef;

      const retrospectiveSnapshot = await retrospectiveRef.get();
      if (!retrospectiveSnapshot.exists) return null;

      const retrospectiveData = retrospectiveSnapshot.data();
      return {
        ...retrospectiveData,
        organizationId: orgDoc.id,
        teamId,
        type: retrospectiveData.access?.type ?? '',
      };
    });

    const boardResults = await Promise.all(boardPromises);
    const board = boardResults.find((b) => b !== null);

    return board ?? null;
  } catch (e) {
    console.error(e);
    return null;
  }
}
