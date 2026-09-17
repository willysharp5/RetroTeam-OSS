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
  INVITES_COLLECTION,
  ORGANIZATIONS_COLLECTION,
} from '~/lib/firestore-collections';
import { InvitesListProps } from '~/lib/teams/types/teams';

import { onListenerError } from '~/lib/firestore-listener-error';

/**
 * @description Hook to fetch the organization's invited members where team.id = 1
 * @param organizationId
 */
export function useFetchInvitedTeamMembers(
  organizationId: string,
  teamId: string,
  pageSize: number,
  searchText: string,
) {
  const firestore = useFirestore();

  const collectionRef = collection(
    firestore,
    ORGANIZATIONS_COLLECTION,
    organizationId,
    INVITES_COLLECTION,
  ) as CollectionReference<WithId<MembershipInvite>>;

  const [data, setData] = useState<WithId<MembershipInvite> | any>();
  const [totalInvitations, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [error, setError] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (organizationId && teamId) {
      if (searchText === '') fetchData(1);
      else search(1, searchText);
    }
  }, [pageSize, organizationId, teamId]);


  const fetchData = useCallback(
    (page: number) => {
      if (teamId == null || teamId === '') {
        setLoading(false);
        return () => {};
      }
      let unsubscribe: (() => void) | undefined;

      try {
        const startAtIndex = (page - 1) * pageSize;

        setLoading(true);

        let q = query(
          collectionRef,
          orderBy('created', 'desc'),
          where('team.id', '==', teamId),
          where('type', '==', 'team')
        );

        const handleSnapshot = (snapshot: any) => {
          const inviteData = snapshot.docs.map((doc: any) => doc.data());


          setData(inviteData);
        };

        if (startAtIndex > 0) {
          getDocs(q).then((querySnapshot) => {
            if (!querySnapshot.empty) {
              const lastMember = querySnapshot.docs[startAtIndex - 1];
              q = query(q, startAfter(lastMember), limit(pageSize));
            } else {
              q = query(q, limit(pageSize));
            }

            unsubscribe = onSnapshot(q, handleSnapshot,
              onListenerError('use-fetch-invited-members', {
                setError,
                setLoading,
              }),
            );
          });
        } else {
          q = query(q, limit(pageSize));
          unsubscribe = onSnapshot(q, handleSnapshot,
            onListenerError('use-fetch-invited-members', {
              setError,
              setLoading,
            }),
          );
        }

        // TOTAL TEAM INVITES
        const totalQuery = query(collectionRef, orderBy('created', 'desc'),
          where('team.id', '==', teamId),
          where('type', '==', 'team'));
        getDocs(totalQuery).then((totalMembers) => {
          setTotal(totalMembers.size);
          setTotalPages(Math.ceil(totalMembers.size / pageSize));
          setCurrentPage(page);
        });
      } catch (error: any) {
        console.error('Error fetching members:', error);
        setData([]);
        setError(error);
      } finally {
        setLoading(false);
      }

      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    },
    [collectionRef, pageSize, teamId],
  );



  const sortData = useCallback(
    async (page: number, type: string) => {
      if (teamId == null || teamId === '') {
        setLoading(false);
        return;
      }
      try {
        // Calculate the startAt value based on the page number and page size
        const startAtIndex = (page - 1) * pageSize;
        // Initialize the query, ordered by created
        let q = query(collectionRef, where('type', '==', 'team'));
        if (type === 'ascending') {
          q = query(q, orderBy('email', 'asc'), where('team.id', '==', teamId));
        } else {
          q = query(
            q,
            orderBy('email', 'desc'),
            where('team.id', '==', teamId),
          );
        }

        // If not the first page, use startAfter to paginate
        if (startAtIndex > 0) {
          const querySnapshot = await getDocs(q);
          const lastInvite = querySnapshot.docs[startAtIndex - 1];
          q = query(q, startAfter(lastInvite));
        }
        // Limit the results to the specified pageSize
        q = query(q, limit(pageSize));

        const invitesQuerySnapshot = await getDocs(q);

        // Map the documents to an array of retrospectives
        const inviteData: InvitesListProps[] = [];
        invitesQuerySnapshot.forEach((doc) => {
          inviteData.push({
            ...doc.data(),
          } as any);
        });

        setData(inviteData);
        setError(null);

        // Calculate the total number of pages based on the total number of members for the team
        const totalQuery = query(
          collectionRef,
          orderBy('email'),
          where('type', '==', 'team'),
          where('team.id', '==', teamId),
        );
        const totalMembers = await getDocs(totalQuery);
        const totalPages = Math.ceil(totalMembers.size / pageSize);
        setTotal(totalMembers.size);
        setTotalPages(totalPages);

        setCurrentPage(page);
      } catch (error: any) {
        console.error('Error fetching teams:', error);
        setData([]);
        setError(error);
      } finally {
        setLoading(false);
      }
    },
    [teamId, pageSize, collectionRef],
  );

  const search = useCallback(
    async (page: number, text: string) => {
      if (teamId == null || teamId === '') {
        setLoading(false);
        return;
      }
      try {
        // Calculate the startAt value based on the page number and page size
        const startAtIndex = (page - 1) * pageSize;

        // Initialize the query, ordered by created
        let q = query(
          collectionRef,
          orderBy('email'),
          where('team.id', '==', teamId),
          where('type', '==', 'team'),
          where('email', '>=', text),
          where('email', '<=', text + '~'),
        );
        // If not the first page, use startAfter to paginate
        if (startAtIndex > 0) {
          const querySnapshot = await getDocs(q);
          const lastInvite = querySnapshot.docs[startAtIndex - 1];
          q = query(q, startAfter(lastInvite));
        }
        // Limit the results to the specified pageSize
        q = query(q, limit(pageSize));

        const invitesQuerySnapshot = await getDocs(q);

        // Map the documents to an array of retrospectives
        const inviteData: InvitesListProps[] = [];
        invitesQuerySnapshot.forEach((doc) => {
          inviteData.push({
            ...doc.data(),
          } as any);
        });

        setData(inviteData);
        setError(null);

        // Calculate the total number of pages based on the total number of members for the team
        const totalQuery = query(
          collectionRef,
          orderBy('email'),
          where('type', '==', 'team'),
          where('team.id', '==', teamId),
          where('email', '>=', text),
          where('email', '<=', text + '~'),
        );
        const totalMembers = await getDocs(totalQuery);
        const totalPages = Math.ceil(totalMembers.size / pageSize);

        setTotalPages(totalPages);

        setCurrentPage(page);
      } catch (error: any) {
        console.error('Error fetching teams:', error);
        setData([]);
        setError(error);
      } finally {
        setLoading(false);
      }
    },
    [teamId, pageSize, collectionRef],
  );

  return {
    data,
    refetch: fetchData,
    sortData,
    totalInvitations,
    loading,
    error,
    currentPage,
    totalPages,
    search,
  };
}
