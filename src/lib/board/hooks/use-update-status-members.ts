import { useFirestore } from 'reactfire';
import { collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useCallback } from 'react';

import {
  ORGANIZATIONS_COLLECTION,
  RETROSPECTIVES_COLLECTION,
  TEAMS_COLLECTION,
} from '~/lib/firestore-collections';

export function useUpdateStatusBoardMember() {
  const firestore = useFirestore();

  return useCallback(
    async (
      organizationId: string,
      teamId: string,
      retrospectiveId: string,
      userId: string,
      type: string,
      value: any,
    ) => {
      if (
        organizationId &&
        teamId &&
        retrospectiveId &&
        userId &&
        value !== undefined
      ) {
        const retrospectivesCollection = collection(
          firestore,
          ORGANIZATIONS_COLLECTION,
          organizationId,
          RETROSPECTIVES_COLLECTION,
        );

        const boardRef = doc(retrospectivesCollection, retrospectiveId);

        const querySnapshot = await getDoc(boardRef);
        if (querySnapshot.exists()) {
          const boardData = querySnapshot.data();
          // Set the user's status of the board field
          if (type === 'status') {
            await updateDoc(boardRef, { status: value });
          } else if (type === 'href') {
            await updateDoc(boardRef, { href: value });
          } else {
            // Check if the user exists in the board data
            if (boardData.members && boardData.members[userId]) {
              // Set the user's status 'vote' field
              if (type === 'voteDone') {
                boardData.members[userId].voteDone = value;
              }
              // Set the user's status 'capture' field
              if (type === 'captureDone') {
                boardData.members[userId].captureDone = value;
              }

              // Update the document in Firestore with modified data
              await updateDoc(boardRef, boardData);
            } else {
              console.log(`User ${userId} not found in the board.`);
            }
          }
        } else {
          console.log('Retrospective document does not exist.');
        }
      }
    },
    [firestore],
  );
}
