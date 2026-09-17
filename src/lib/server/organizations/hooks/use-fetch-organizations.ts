import { useCallback, useState, useEffect } from 'react';
import { useFirestore } from 'reactfire';
import {
  collection,
  query,
  where,
  orderBy,
  startAfter,
  limit,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import {
  ORGANIZATIONS_COLLECTION,
  TEAMS_COLLECTION,
} from '~/lib/firestore-collections';

import { onListenerError } from '~/lib/firestore-listener-error';

export function useFetchOrganizations(
  pageSize: number,
  text: string,
  sorted: string,
) {
  const firestore = useFirestore();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [totalOrganizations, setTotalOrganizations] = useState<number>(0);

  useEffect(() => {
    fetchData(1, text, sorted);
  }, [pageSize, text, sorted]);

  const fetchData = useCallback(
    async (page: number, text: string, sort: any) => {
      try {
        const organizationCollection = collection(
          firestore,
          ORGANIZATIONS_COLLECTION,
        );
        setLoading(true);

        const startAtIndex = (page - 1) * pageSize;

        let q = query(organizationCollection, orderBy('searchableName', sort));

        if (text && text !== '') {
          const search = text.toLowerCase().replace(/\s+/g, '');
          console.log('search', search);
          q = query(
            q,
            where('searchableName', '>=', search),
            where('searchableName', '<=', search + '\uf8ff'),
          );
        }

        if (startAtIndex > 0) {
          const querySnapshot = await getDocs(q);
          const lastTeam = querySnapshot.docs[startAtIndex - 1];
          q = query(q, startAfter(lastTeam));
        }

        q = query(q, limit(pageSize));

        const unsubscribe = onSnapshot(q, async (snapshot) => {
          const users = [] as any[];
          for (const doc of snapshot.docs) {
            const teamsCollection = collection(
              firestore,
              ORGANIZATIONS_COLLECTION,
              doc.id,
              TEAMS_COLLECTION,
            );
            const teamsQuerySnapshot = await getDocs(teamsCollection);
            const organizationData = doc.data();
            organizationData.id = doc.id;
            organizationData.teams = teamsQuerySnapshot.size;
            users.push(organizationData);
          }

          setData(users);
          setError(null);

          let totalQuery = query(
            organizationCollection,
            orderBy('searchableName', sort),
          );

          if (text && text !== '') {
            const search = text.toLowerCase().replace(/\s+/g, '');
            totalQuery = query(
              totalQuery,
              where('searchableName', '>=', search),
              where('searchableName', '<=', search + '\uf8ff'),
            );
          }

          const totalOrganizationsSnapshot = await getDocs(totalQuery);
          setTotalOrganizations(totalOrganizationsSnapshot.size);
          const totalPages = Math.ceil(
            totalOrganizationsSnapshot.size / pageSize,
          );
          setTotalPages(totalPages);
          setTotalUsers(totalOrganizationsSnapshot.size);
        },
          onListenerError('use-fetch-organizations', { setError, setLoading }),
        );

        setCurrentPage(page);

        return () => unsubscribe();
      } catch (error: any) {
        console.error('Error fetching teams:', error);
        setData([]);
        setError(error);
      } finally {
        setLoading(false);
      }
    },
    [pageSize, firestore],
  );

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    currentPage,
    totalPages,
    totalUsers,
    loadingSearch,
    totalOrganizations,
  };
}
