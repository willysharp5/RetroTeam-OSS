import { useFirestore } from 'reactfire';
import { collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useCallback } from 'react';

import {
  ORGANIZATIONS_COLLECTION,
  RETROSPECTIVES_COLLECTION,
  TEAMS_COLLECTION,
} from '~/lib/firestore-collections';

export function useMoveRetrospectiveTeam() {
  const firestore = useFirestore();

  return useCallback(
    async (organizationId: string, teamId: string, retrospectiveId: string) => {
      const retrospectiveCollection = collection(
        firestore,
        ORGANIZATIONS_COLLECTION,
        organizationId,
        RETROSPECTIVES_COLLECTION,
      );
      const retrospectiveRef = doc(retrospectiveCollection, retrospectiveId);

      const teamCollection = collection(
        firestore,
        ORGANIZATIONS_COLLECTION,
        organizationId,
        TEAMS_COLLECTION,
      );
      const teamRef = doc(teamCollection, teamId);

      const retrospectiveSnapshot = await getDoc(retrospectiveRef);

      if (retrospectiveSnapshot.exists()) {
        const updatedData = {
          team: teamRef,
        };
        await updateDoc(retrospectiveRef, updatedData);

        console.log('Retrospective team updated successfully.');
      } else {
        console.log('Retrospective document does not exist.');
      }
    },
    [firestore],
  );
}
