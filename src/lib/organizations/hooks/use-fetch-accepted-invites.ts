import {
  collection,
  CollectionReference,
  query,
  onSnapshot,
} from 'firebase/firestore';
import { useFirestore } from 'reactfire';
import { useState, useEffect } from 'react';
import { MembershipInvite } from '~/lib/organizations/types/membership-invite';

import {
  ACCEPTED_INVITES_COLLECTION,
  ORGANIZATIONS_COLLECTION,
} from '~/lib/firestore-collections';

/**
 * @description Hook to fetch the organization's accepted invited members in real-time
 * @param organizationId
 */
export function useFetchAcceptedInvitedMembers(
  organizationId: string,
) {
  const firestore = useFirestore();
  const [totalInvitations, setTotal] = useState(0);
  const [error, setError] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) return;

    const collectionRef = collection(
      firestore,
      ORGANIZATIONS_COLLECTION,
      organizationId,
      ACCEPTED_INVITES_COLLECTION,
    ) as CollectionReference<WithId<MembershipInvite>>;

    const q = query(collectionRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setTotal(snapshot.size);
        setLoading(false);
      },
      (err) => {
        console.error('Error with accepted invites snapshot:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe(); // Clean up
  }, [firestore, organizationId]);

  return {
    totalInvitations,
    loading,
    error,
  };
}
