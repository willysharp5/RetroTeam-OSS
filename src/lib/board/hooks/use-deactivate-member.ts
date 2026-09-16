import { useFirestore } from 'reactfire';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { useCallback } from 'react';

import {
  NOTIFICATIONS_COLLECTION,
  ORGANIZATIONS_COLLECTION,
  RETROSPECTIVES_COLLECTION,
  USERS_COLLECTION,
} from '~/lib/firestore-collections';

export function useActivateBoardMember() {
  const firestore = useFirestore();

  return useCallback(
    async (
      organizationId: string,
      retrospectiveId: string,
      userId: string,
      activate: boolean,
      facilitator: string,
    ) => {
      const retrospectivesCollection = collection(
        firestore,
        ORGANIZATIONS_COLLECTION,
        organizationId,
        RETROSPECTIVES_COLLECTION,
      );
      const boardRef = doc(retrospectivesCollection, retrospectiveId);

      const membersCollection = collection(
        firestore,
        ORGANIZATIONS_COLLECTION,
        organizationId,
        RETROSPECTIVES_COLLECTION,
        retrospectiveId,
        'users',
      );
      const memberRef = doc(membersCollection, userId);

      const notificationsCollection = collection(
        firestore,
        ORGANIZATIONS_COLLECTION,
        organizationId,
        NOTIFICATIONS_COLLECTION,
      );
      const notificationRef = doc(notificationsCollection);

      const userColelction = collection(firestore, USERS_COLLECTION);
      const userRef = doc(userColelction, userId);
      const userQuerySnapshot = await getDoc(userRef);
      const userData = userQuerySnapshot.data();

      const querySnapshot = await getDoc(boardRef);
      if (querySnapshot.exists()) {
        const boardData = querySnapshot.data();

        // Check if the user exists in the board data
        if (boardData.members && boardData.members[userId]) {
          // Set the user's 'active' field to true
          boardData.members[userId].active = activate;

          // Update the document in Firestore with modified data
          await updateDoc(boardRef, boardData);
          await updateDoc(memberRef, { active: activate });
          if (!activate) {
            const notificationData = {
              title: 'Removed',
              created: new Date(),
              category: 'removed',
              type: 'board',
              subtitle: `<p>You have been removed from <b>${boardData.name}</b> by <b>${facilitator}</b> </p>`,
              information: {
                organizationId,
                teamId: '',
                retrospectiveId,
              },
              email: userData?.email,
              id: notificationRef.id,
              seen: false,
            };
            await setDoc(notificationRef, notificationData);
          }
        } else {
          console.log(`User ${userId} not found in the board.`);
        }
      } else {
        console.log('Retrospective document does not exist.');
      }
    },
    [firestore],
  );
}
