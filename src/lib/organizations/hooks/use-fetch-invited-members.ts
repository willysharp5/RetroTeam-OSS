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
import { MembershipRole } from '../types/membership-role';
import { DocumentData, QuerySnapshot } from 'firebase-admin/firestore';

import { onListenerError } from '~/lib/firestore-listener-error';

/**
 * @description Hook to fetch the organization's invited members
 * @param organizationId
 * @param type
 * @param pageSize
 * @param sort
 */
export function useFetchInvitedMembers(
  organizationId: string,
  type: string,
  pageSize: number,
  sort: boolean,
) {
  const firestore = useFirestore();

  const collectionRef = collection(
    firestore,
    ORGANIZATIONS_COLLECTION,
    organizationId,
    INVITES_COLLECTION,
  ) as CollectionReference<WithId<MembershipInvite>>;

  const [data, setData] = useState<WithId<MembershipInvite> | any>();
  const [adminsInvites, setAdminsInvites] = useState<WithId<MembershipInvite> | any>();

  const [totalInvitations, setTotal] = useState(0);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);

  const [error, setError] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (organizationId) {
      fetchData(1);
      fetchAdminData();

    }
  }, [organizationId, pageSize, type, sort]);

  const fetchData = useCallback(
    (page: number) => {
      let unsubscribe: (() => void) | undefined;

      try {
        const startAtIndex = (page - 1) * pageSize;

        setLoading(true);

        let q = query(
          collectionRef,
          orderBy('created', 'desc'),
          where('type', '==', 'organization'),
        );

        const handleSnapshot = (snapshot: any) => {
          const inviteData = snapshot.docs.map((doc: any) => doc.data());

          inviteData.sort((a: any, b: any) =>
            sort
              ? a.email.toUpperCase().localeCompare(b.email.toUpperCase())
              : b.email.toUpperCase().localeCompare(a.email.toUpperCase()),
          );

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

        // TOTAL ORGANIZATION INVITES
        const totalQuery = query(collectionRef, where('type', '==', 'organization'));
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
    [collectionRef, pageSize, sort],
  );


  const fetchAdminData = useCallback(async () => {
    try {
      setLoading(true);

      const q = query(
        collectionRef,
        orderBy('created', 'desc'),
        where('type', '==', 'organization'),
        where('role', '==', MembershipRole.Admin)
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const inviteData = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
        }));

        setTotal(querySnapshot.size);
        setAdminsInvites(inviteData);
        setError(null);
      },
        onListenerError('use-fetch-invited-members', { setError, setLoading }),
      );

      return unsubscribe;
    } catch (error: any) {
      console.error('Error fetching admin invites members:', error);
      setAdminsInvites([]);
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [collectionRef]);



  return {
    data,
    refetch: fetchData,
    totalInvitations,
    loading,
    error,
    currentPage,
    totalPages,
    adminsInvites
  };
}
