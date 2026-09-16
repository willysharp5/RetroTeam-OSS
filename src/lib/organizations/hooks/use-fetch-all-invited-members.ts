import {
  collection,
  CollectionReference,
  where,
  query,
  startAfter,
  endBefore,
  limitToLast,
  getDocs,
} from 'firebase/firestore';
import { useFirestore } from 'reactfire';
import { orderBy } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { MembershipInvite } from '~/lib/organizations/types/membership-invite';

import {
  INVITES_COLLECTION,
  ORGANIZATIONS_COLLECTION,
} from '~/lib/firestore-collections';

/**
 * @description Hook to fetch the organization's invited members where team.id = 1
 * @param organizationId
 */
export function useFetchAllInvitedMembers(
  organizationId: string,
  teamId: string,
  type: string,
  limitNumber: number,
  lastId: string,
) {
  const firestore = useFirestore();

  const collectionRef = collection(
    firestore,
    ORGANIZATIONS_COLLECTION,
    organizationId,
    INVITES_COLLECTION,
  ) as CollectionReference<WithId<MembershipInvite>>;

  const [data, setData] = useState<WithId<MembershipInvite> | any>();

  function refetch(type: string, lastId: string) {
    getInvites(type, lastId);
  }

  useEffect(() => {
    getInvites(type, lastId);
  }, []);

  async function getInvites(type: string, lastId: string) {
    const invitationQuery = query(
      collectionRef,
      type === 'lasts' ? orderBy('created', 'desc') : orderBy('created', 'asc'),
    );

    let pagedInvitationsQuery = query(invitationQuery);

    pagedInvitationsQuery = query(invitationQuery);

    if (lastId !== '' && type === 'next') {
      pagedInvitationsQuery = query(pagedInvitationsQuery, startAfter(lastId));
    } else if (lastId !== '' && type === 'prev') {
      pagedInvitationsQuery = query(
        pagedInvitationsQuery,
        endBefore(lastId),
        limitToLast(limitNumber),
      );
    }

    const queryRef = query(
      pagedInvitationsQuery,
      where('team.id', '==', teamId),
    );
    const querySnapshot = await getDocs(queryRef);

    const invites = [];

    for (const teamDoc of querySnapshot.docs) {
      invites.push(teamDoc.data());
    }

    setData(invites);
  }

  return { data, refetch };
}
