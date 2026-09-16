import { useFirestore } from 'reactfire';
import {
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

export function useUpdateRoleBoardMember() {
  const firestore = useFirestore();

  return useCallback(
    async (
      organizationId: string,
      retrospectiveId: string,
      userId: string,
      role: number,
      facilitator: string,
    ) => {
      const retrospectiveCollection = collection(
        firestore,
        ORGANIZATIONS_COLLECTION,
        organizationId,
        RETROSPECTIVES_COLLECTION,
      );
      const boardRef = doc(retrospectiveCollection, retrospectiveId);

      const membersCollection = collection(
        firestore,
        ORGANIZATIONS_COLLECTION,
        organizationId,
        RETROSPECTIVES_COLLECTION,
        retrospectiveId,
        'users',
      );
      const memberRef = doc(membersCollection, userId);

      const notificationCollection = collection(
        firestore,
        ORGANIZATIONS_COLLECTION,
        organizationId,
        NOTIFICATIONS_COLLECTION,
      );
      const notificationRef = doc(notificationCollection);

      const usersCollection = collection(firestore, USERS_COLLECTION);
      const userRef = doc(usersCollection, userId);

      function getSelectedRoleModel(currentRole: any) {
        if (currentRole === 0) {
          return 'Member';
        } else if (currentRole === 1) {
          return 'Facilitator';
        }
      }
      const usersQuerySnapshot = await getDoc(userRef);
      const querySnapshot = await getDoc(boardRef);
      if (querySnapshot.exists()) {
        const boardData = querySnapshot.data();
        const userData = usersQuerySnapshot.data();

        // Check if the user exists in the board data
        if (boardData.members && boardData.members[userId]) {
          // Set the user's 'active' field to true
          boardData.members[userId].role = role;

          // Update the document in Firestore with modified data
          await updateDoc(boardRef, boardData);
          await updateDoc(memberRef, { role: role });

          let actualRole = 0;

          if (role === 0) {
            actualRole = 1;
          } else {
            actualRole = 0;
          }

          const oldRoleName = getSelectedRoleModel(actualRole);
          const newRoleName = getSelectedRoleModel(role);

          const notificationData = {
            title: 'Updated',
            created: new Date(),
            category: 'updated',
            type: 'board',
            subtitle: `<p>Your role has been updated from <b>${oldRoleName}</b> to <b>${newRoleName}</b> by <b>${facilitator}</b> in <a href="/board/${retrospectiveId}" class="text-blue-500 underline"><b>${boardData.name}</b></a></p>`,
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
