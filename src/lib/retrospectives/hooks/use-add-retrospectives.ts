import { useCallback } from 'react';

import { addDoc, setDoc, collection, doc } from 'firebase/firestore';
import { useFirestore } from 'reactfire';
import { v4 as uuidv4 } from 'uuid';

import { ORGANIZATIONS_COLLECTION } from '~/lib/firestore-collections';
import { TEAMS_COLLECTION } from '~/lib/firestore-collections';
import { RETROSPECTIVES_COLLECTION } from '~/lib/firestore-collections';
import { USERS_COLLECTION } from '~/lib/firestore-collections';

import { AddRetrospectives } from '../types/retrospectives';
import { MembershipRole } from '~/lib/organizations/types/membership-role';
import { Structure } from '~/lib/structures/types/structures';

export function useAddRetrospective() {
  const firestore = useFirestore();

  return useCallback(
    async (
      retrospective: AddRetrospectives,
      userId: string,
      organizationID: string,
      teamId: string,
    ) => {
      try {
        const teamDocRef = doc(
          firestore,
          ORGANIZATIONS_COLLECTION,
          organizationID,
        );

        const retrospectivesCollection = collection(
          teamDocRef,
          RETROSPECTIVES_COLLECTION,
        );

        const organizationDocRef = doc(
          firestore,
          ORGANIZATIONS_COLLECTION,
          organizationID,
        );
        const userRef = doc(firestore, USERS_COLLECTION, userId);
        const teamRef = doc(
          firestore,
          ORGANIZATIONS_COLLECTION,
          organizationID,
          TEAMS_COLLECTION,
          teamId,
        );

        const searchableName = retrospective.name
          .replace(' ', '')
          .toLowerCase();

        const retrospectivesMembers = {
          [userId]: {
            user: userRef,
            role: MembershipRole.Admin,
            userId,
            active: true,
            created: new Date(),
            captureDone: false,
            voteDone: false,
          },
        };
        retrospective.locked = false;
        retrospective.members = retrospectivesMembers;
        retrospective.archived = false;
        retrospective.createdBy = userId;
        retrospective.team = teamRef;
        retrospective.finished = false;
        retrospective.searchableName = searchableName;
        retrospective.allowMembersViewComments = false
        retrospective.groupWithAI = true
        retrospective.actionsWithAI = true

        // Convert structure array to an object with auto-generated ID
        const newStructure = retrospective.structure.reduce(
          (acc: Structure[], item: Structure) => {
            const itemId = uuidv4();
            acc.push({ id: itemId, ...item });
            return acc;
          },
          [],
        );

        retrospective.structure = newStructure;

        // Add the document to Firestore without an ID
        const addedDocRef = await addDoc(
          retrospectivesCollection,
          retrospective,
        );
        // Get the auto-generated ID
        const retrospectiveId = addedDocRef.id;
        // Update the document with the generated retrospectiveId
        const retrospectiveDocRef = doc(
          retrospectivesCollection,
          retrospectiveId,
        );
        await setDoc(retrospectiveDocRef, {
          ...retrospective,
          // Add the ID to the document
          id: retrospectiveId,
          href: retrospective.icebreaker ? `/icebreaker?id=${retrospectiveId}` : `/board/${retrospectiveId}`,
        });

        //Create board
        const boardCollectionRef = collection(organizationDocRef, 'board');
        const initialBoardDocRef = doc(boardCollectionRef, retrospectiveId);
        await setDoc(initialBoardDocRef, {
          retrospectiveId,
          retrospectiveRef: retrospectiveDocRef,
          teamId,
          teamRef: teamDocRef,
          authors: true,
          votes: 5,
          archived: false,
        });

        //Create users collection
        const usersRetrospectiveCollectionRef = collection(
          organizationDocRef,
          'retrospectives',
          retrospectiveId,
          'users',
        );
        const retrospectiveUseresRef = doc(
          usersRetrospectiveCollectionRef,
          userId,
        );
        await setDoc(retrospectiveUseresRef, {
          active: true,
          role: MembershipRole.Facilitator,
          user: userRef,
          userId,
          created: new Date(),
        });

        return retrospectiveId; // Return the document ID
      } catch (e) {}
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
}
