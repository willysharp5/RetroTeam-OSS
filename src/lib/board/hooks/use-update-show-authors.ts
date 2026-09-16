import { useFirestore } from 'reactfire';
import { collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useCallback } from 'react';

import {
  BOARD_COLLECTION,
  ORGANIZATIONS_COLLECTION,
} from '~/lib/firestore-collections';

export function useUpdateBoardSettings() {
  const firestore = useFirestore();

  return useCallback(
    async (
      organizationId: string,
      retrospectiveId: string,
      type: string,
      value: any,
    ) => {
      const boardCollection = collection(
        firestore,
        ORGANIZATIONS_COLLECTION,
        organizationId,
        BOARD_COLLECTION,
      );

      const boardRef = doc(boardCollection, retrospectiveId);

      const boardSnapshot = await getDoc(boardRef);

      if (boardSnapshot.exists()) {
        if (type === 'authors') {
          const updatedData = {
            authors: value,
          };
          await updateDoc(boardRef, updatedData);
        } else if (type === 'votes') {
          const updatedData = {
            votes: value,
          };
          await updateDoc(boardRef, updatedData);
        }
      } else {
        console.log('Retrospective document does not exist.');
      }
    },
    [firestore],
  );
}
