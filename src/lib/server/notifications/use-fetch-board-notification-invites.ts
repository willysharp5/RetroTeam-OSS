import {
  collection,
  CollectionReference,
  where,
  query,
  limit,
  startAfter,
  endBefore,
  limitToLast,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import { useFirestore } from 'reactfire';
import { orderBy } from 'firebase/firestore';
import { useState, useEffect, useCallback } from 'react';
import { MembershipInvite } from '~/lib/organizations/types/membership-invite';

import {
  NOTIFICATIONS_COLLECTION,
  ORGANIZATIONS_COLLECTION,
} from '~/lib/firestore-collections';
import { InvitesListProps } from '~/lib/teams/types/teams';

import { onListenerError } from '~/lib/firestore-listener-error';

/**
 * @description Hook to fetch the organization's invited members where team.id = 1
 * @param organizationId
 */
export function useFetchBoardNotificationInvites(
  organizationId: string,
  pageSize: number,
  userEmail: string,
) {
  const firestore = useFirestore();

  const collectionRef = collection(
    firestore,
    ORGANIZATIONS_COLLECTION,
    organizationId,
    NOTIFICATIONS_COLLECTION,
  ) as CollectionReference<WithId<MembershipInvite>>;

  const [data, setData] = useState<WithId<MembershipInvite> | any>();
  const [totalInvitations, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [error, setError] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (organizationId) {
      fetchData(1);
    }
  }, [pageSize, organizationId]);

  const fetchData = useCallback(
    async (page: number) => {
      try {
        setLoading(true);
        // Calculate the startAt value based on the page number and page size
        const startAtIndex = (page - 1) * pageSize;

        // Initialize the query, ordered by created
        let q = query(
          collectionRef,
          orderBy('created', 'desc'),
          where('email', '==', userEmail),
          where('type', '==', 'board'),
        );

        // If not the first page, use startAfter to paginate
        if (startAtIndex > 0) {
          const querySnapshot = await getDocs(q);
          const lastInvite = querySnapshot.docs[startAtIndex - 1];
          q = query(q, startAfter(lastInvite));
        }
        // Limit the results to the specified pageSize
        q = query(q, limit(pageSize));

        // Listen for real-time updates
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const inviteData: InvitesListProps[] = [];
          snapshot.forEach((doc) => {
            inviteData.push({
              ...doc.data(),
            } as any);
          });

          setData(inviteData);
          setError(null);

          // Calculate the total number of pages based on the total number of members for the team
          const totalQuery = query(
            collectionRef,
            orderBy('created', 'desc'),
            where('email', '==', userEmail),
            where('type', '==', 'board'),
          );
          getDocs(totalQuery).then((totalMembers) => {
            const totalPages = Math.ceil(totalMembers.size / pageSize);
            setTotal(totalMembers.size);
            setTotalPages(totalPages);
          });
        },
          onListenerError('use-fetch-board-notification-invites', {
            setError,
            setLoading,
          }),
        );

        setCurrentPage(page);

        // Cleanup function to unsubscribe from real-time updates
        return () => unsubscribe();
      } catch (error: any) {
        console.error('Error fetching teams:', error);
        setData([]);
        setError(error);
      } finally {
        setLoading(false);
      }
    },
    [pageSize, collectionRef, userEmail],
  );

  return {
    data,
    refetch: fetchData,
    totalInvitations,
    loading,
    error,
    currentPage,
    totalPages,
  };
}
