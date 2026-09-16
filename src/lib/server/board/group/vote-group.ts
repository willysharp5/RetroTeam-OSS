import { getOrganizationsCollection } from '~/lib/server/collections';
import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';
interface Params {
  id: string;
  organization: string;
  retrospectiveId: string;
  userId: string;
  userVotes: number;
}

/**
 * @name VoteGroup
 * @description Hook to vote a group
 */

export async function VoteGroup({
  id,
  organization,
  retrospectiveId,
  userId,
  userVotes,
}: Params) {
  const firestore = getRestFirestore();
  const batch = firestore.batch();
  const groupRef = getOrganizationsCollection()
    .doc(organization)
    .collection('board')
    .doc(retrospectiveId)
    .collection('groups')
    .doc(id);
  const existingSnapshot = await groupRef.get();
  const existingData = existingSnapshot.data();
  try {
    if (existingData) {
      // If the voters already exists, update it by merging the existing comments with the new ones
      batch.update(groupRef, {
        voters: {
          ...(existingData.voters || {}),
          [userId]: {
            votes: userVotes,
          },
        },
      });
    } else {
      // If the votes does not exist, create it
      batch.create(groupRef, {
        voters: {
          [userId]: {
            votes: userVotes,
          },
        },
      });
    }

    await batch.commit();

    const snapshot = await groupRef.get();
    const newData = snapshot.data();

    return newData;
  } catch (error) {
    console.error('Error voting grouping:', error);
  }
}
