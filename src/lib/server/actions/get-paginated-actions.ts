import { useCallback, useEffect, useState } from 'react';
import { useFirestore } from 'reactfire';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  startAfter,
  limit,
} from 'firebase/firestore';
import { USERS_COLLECTION } from '~/lib/firestore-collections';

function useFetchPaginatedActions(
  organization: string,
  assigneeFilter: string,
  teamId: string,
  pageSize: number,
  filter: number,
  boardId: string,
) {
  const firestore = useFirestore();

  // General
  const actionsCollectionPath = `organizations/${organization}/teams/${teamId}/actions`;
  const actionsCollectionRef = collection(firestore, actionsCollectionPath);

  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<any[] | null>(null);
  const [error, setError] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalActions, setTotalActions] = useState(0);
  const fetchData = useCallback(
    async (page: number) => {
      const getUserData = async (id: string) => {
        if (id !== '') {
          try {
            const userRef = doc(firestore, USERS_COLLECTION, id);

            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
              const userData = userDoc.data();
              return userData;
            }
          } catch (error) {
            console.error('Error', error);
            return null;
          }
        }
      };

      setLoading(true);
      // Calculate the startAt value based on the page number and page size
      const startAtIndex = (page - 1) * pageSize;

      let q = query(
        actionsCollectionRef,
        orderBy('date', 'desc'),
        where('archive', '==', false), // Order by the field with the inequality filter
      );
      
      if (assigneeFilter !== 'Any member' && assigneeFilter != undefined) {
        q = query(q, where('assignee', '==', assigneeFilter));
      }

      // If not the first page, use startAfter to paginate
      if (startAtIndex > 0) {
        const querySnapshot = await getDocs(q);
        const lastAction = querySnapshot.docs[startAtIndex - 1];

        q = query(q, startAfter(lastAction));
      }

      // Limit the results to the specified pageSize
      q = query(q, limit(pageSize));

      try {
        const querySnapshot = await getDocs(q);
        const userData = [];

        for (const docSnapshot of querySnapshot.docs) {
          const item = docSnapshot.data();
          const user = await getUserData(item.assignee);
          if (user) {
            userData.push({ ...item, user });
          } else {
            const user = { name: '', lastName: '' };
            userData.push({ ...item, user });
          }
        }
        setData(userData);

        // Calculate the total number of pages based on the total number of retrospectives for the organization

        let totalQuery = query(actionsCollectionRef);
        if (assigneeFilter !== 'Any member') {
          totalQuery = query(
            totalQuery,
            where('assignee', '==', assigneeFilter),
          );
        }

        const totalActions = await getDocs(totalQuery);
        const totalPages = Math.ceil(totalActions.size / pageSize);
        setTotalPages(totalPages);
        setTotalActions(totalActions.size);
        setLoading(false);
        setCurrentPage(page);
      } catch (error) {
        console.error('Error fetching documents:', error);
        setError(error);
        setLoading(false);
      }
    },
    [pageSize, assigneeFilter, actionsCollectionRef, firestore],
  );

  const fetchBoardActionsData = useCallback(
    async (page: number) => {
      setLoading(true);
      //Board
      const actionsBoardCollectionPath = `organizations/${organization}/board/${boardId}/actions`;
      const actionsBoardCollectionRef = collection(
        firestore,
        actionsBoardCollectionPath,
      );

      const getUserData = async (id: string) => {
        if (id !== '') {
          try {
            const userRef = doc(firestore, USERS_COLLECTION, id);

            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
              const userData = userDoc.data();
              return userData;
            }
          } catch (error) {
            console.error('Error', error);
            return null;
          }
        }
      };

      // Calculate the startAt value based on the page number and page size
      const startAtIndex = (page - 1) * pageSize;

      let q = query(
        actionsBoardCollectionRef,
        orderBy('date', 'desc'), // Order by the field with the inequality filter
      );

      if (assigneeFilter !== 'Any member') {
        q = query(q, where('assignee', '==', assigneeFilter));
      }

      // If not the first page, use startAfter to paginate
      if (startAtIndex > 0) {
        const querySnapshot = await getDocs(q);
        const lastAction = querySnapshot.docs[startAtIndex - 1];

        q = query(q, startAfter(lastAction));
      }

      // Limit the results to the specified pageSize
      q = query(q, limit(pageSize));

      try {
        const querySnapshot = await getDocs(q);
        const userData = [];

        for (const docSnapshot of querySnapshot.docs) {
          const item = docSnapshot.data();
          const user = await getUserData(item.assignee);
          if (user) {
            userData.push({ ...item, user });
          } else {
            const user = { name: '', lastName: '' };
            userData.push({ ...item, user });
          }
        }
        setData(userData);

        // Calculate the total number of pages based on the total number of retrospectives for the organization

        let totalQuery = query(actionsBoardCollectionRef);

        const totalActions = await getDocs(totalQuery);
        const totalPages = Math.ceil(totalActions.size / pageSize);
        setTotalPages(totalPages);
        setTotalActions(totalActions.size);
        setCurrentPage(page);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching documents:', error);
        setError(error);
        setLoading(false);
      }
    },
    [pageSize, assigneeFilter, boardId, organization, firestore],
  );

  useEffect(() => {
    if (organization && filter === 1) {
      fetchData(1);
    } else if (boardId) {
      fetchBoardActionsData(1);
    } else {
      setData([]);
      setLoading(false);
    }
  }, [organization, pageSize, assigneeFilter, filter, boardId]);

  return {
    loading,
    data,
    error,
    refetch: filter === 1 ? fetchData : fetchBoardActionsData,
    currentPage,
    totalPages,
    totalActions,
  };
}

export default useFetchPaginatedActions;
