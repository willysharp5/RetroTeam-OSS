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
} from 'firebase/firestore';
import { USERS_COLLECTION } from '~/lib/firestore-collections';

export function useFetchUsers(
  pageSize: number,
  text: string,
  sorted: string,
  sortEmail: string,
) {
  const firestore = useFirestore();

  const [data, setData] = useState<any[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);

  const [error, setError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalUsers, setTotalUsers] = useState(0);

  const fetchData = useCallback(
    async (page: number, text: string, sort: any, sortEmail: any) => {
      try {
        const usersCollection = collection(firestore, USERS_COLLECTION);
        setLoading(true);

        // Calculate the startAt value based on the page number and page size
        const startAtIndex = (page - 1) * pageSize;

        const users = [] as any[];

        let q = query(usersCollection);

        if (sort != 'none') {
          q = query(q, orderBy('searchableName', sort));
        }
        if (sortEmail != 'none') {
          q = query(q, orderBy('email', sortEmail));
        }

        if (text && text != '') {
          const search = text?.replace(/\s+/g, '').toLowerCase();

          q = query(
            q,

            where('searchableName', '>=', search),
            where('searchableName', '<=', search + '\uf8ff'),
          );
        }

        // If not the first page, use startAfter to paginate
        if (startAtIndex > 0) {
          const querySnapshot = await getDocs(q);
          const lastTeam = querySnapshot.docs[startAtIndex - 1];
          q = query(q, startAfter(lastTeam));
        }

        // Limit the results to the specified pageSize
        q = query(q, limit(pageSize));

        const querySnapshot = await getDocs(q);

        for (const usersDoc of querySnapshot.docs) {
          const userData = usersDoc.data();
          userData.id = usersDoc.id;
          users.push(userData);
        }

        // Update the state with the new data
        setData(users);
        setError(null);
        let totalQuery = query(usersCollection);
        if (sort != 'none') {
          totalQuery = query(totalQuery, orderBy('searchableName', sort));
        }
        if (sortEmail != 'none') {
          totalQuery = query(totalQuery, orderBy('email', sortEmail));
        }
        if (text && text != '') {
          const search = text?.replace(/\s+/g, '').toLowerCase();
          totalQuery = query(
            totalQuery,

            where('searchableName', '>=', search),
            where('searchableName', '<=', search + '\uf8ff'),
          );
        }
        // Calculate the total number of pages based on the total number of retrospectives for the organization

        const totalUsers = await getDocs(totalQuery);
        const totalPages = Math.ceil(totalUsers.size / pageSize);
        setTotalPages(totalPages);
        setTotalUsers(totalUsers.size);

        setCurrentPage(page);
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

  useEffect(() => {
    fetchData(1, text, sorted, sortEmail);
  }, [pageSize, text, sorted, text, sortEmail]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    currentPage,
    totalPages,
    totalUsers,
    loadingSearch,
  };
}
