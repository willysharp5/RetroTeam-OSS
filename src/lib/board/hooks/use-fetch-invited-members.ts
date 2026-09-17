import {
  collection,
  CollectionReference,
  where,
  query,
  onSnapshot,
} from 'firebase/firestore';
import { useFirestore } from 'reactfire';
import { orderBy } from 'firebase/firestore';
import { useState, useEffect, useCallback } from 'react';
import { MembershipInvite } from '~/lib/organizations/types/membership-invite';

import {
  BOARD_COLLECTION,
  INVITES_COLLECTION,
  ORGANIZATIONS_COLLECTION,
} from '~/lib/firestore-collections';

import { onListenerError } from '~/lib/firestore-listener-error';

/**
 * @description Hook to fetch the organization's invited members where team.id = 1
 * @param organizationId
 */
export function useFetchInvitedMembers(
  organizationId: string,
  retrospectiveId: string,
) {
  const firestore = useFirestore();

  const [data, setData] = useState<WithId<MembershipInvite> | any>();
  const [totalInvitations, setTotal] = useState(0);
  const [error, setError] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (organizationId && retrospectiveId) {
      const unsubscribe = fetchData();
      return () => unsubscribe();
    }
  }, [retrospectiveId, organizationId]);

  const fetchData = useCallback(() => {
    const collectionRef = collection(
      firestore,
      ORGANIZATIONS_COLLECTION,
      organizationId,
      BOARD_COLLECTION,
      retrospectiveId,
      INVITES_COLLECTION,
    ) as CollectionReference<WithId<MembershipInvite>>;

    try {
      // Initialize the query, ordered by created
      let q = query(
        collectionRef,
        orderBy('created', 'desc'),
        where('retrospective.id', '==', retrospectiveId),
      );

      const unsubscribe = onSnapshot(q, (invitesQuerySnapshot) => {
        // Map the documents to an array of invites
        const inviteData: WithId<MembershipInvite>[] = [];
        invitesQuerySnapshot.forEach((doc) => {
          inviteData.push({
            ...doc.data(),
          });
        });

        setData(inviteData);
        setTotal(invitesQuerySnapshot.size);
        setError(null);
        setLoading(false);
      },
        onListenerError('use-fetch-invited-members', { setError, setLoading }),
      );

      return () => unsubscribe; // Return the unsubscribe function
    } catch (error: any) {
      console.error('Error fetching teams:', error);
      setData([]);
      setError(error);
      setLoading(false);
      return () => {}; // Return a dummy function in case of an error
    }
  }, [organizationId, retrospectiveId, firestore]);

  return { data, refetch: fetchData, totalInvitations, loading, error };
}
