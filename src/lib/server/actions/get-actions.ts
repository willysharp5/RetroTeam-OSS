import { useEffect, useState } from 'react';
import { useFirestore } from 'reactfire';
import {
  collection,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { USERS_COLLECTION } from '~/lib/firestore-collections';

function useFetchActions(
  organization: string,
  assigneeFilter: string,
  dateFilter: string,
  teamId: string,
) {
  const firestore = useFirestore();
  const actionsCollectionPath = `organizations/${organization}/teams/${teamId}/actions`;
  const actionsCollectionRef = collection(firestore, actionsCollectionPath);

  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<any[] | null>(null);
  const [error, setError] = useState<any | null>(null);

  const [totalActions, setTotalActions] = useState(0);

  const fetchData = (assigneeFilter: string, dateFilter: string) => {
    const queryFilters = [];
    queryFilters.push(where('organization', '==', organization));

    if (assigneeFilter !== 'Any member') {
      queryFilters.push(where('assignee', '==', assigneeFilter));
    }

    if (dateFilter !== 'Filter by date') {
      const now = Timestamp.fromDate(new Date());
      switch (dateFilter) {
        case 'No due date':
          queryFilters.push(where('date', '==', null));
          break;
        case 'Overdue':
          queryFilters.push(where('date', '<', now));
          queryFilters.push(where('date', '!=', null));
          queryFilters.push(orderBy('date', 'asc'));
          break;
        case 'Recent':
          queryFilters.push(orderBy('date', 'asc'));
          break;
        default:
          console.error('Invalid dateFilter value');
          setError('Invalid dateFilter value');
          setLoading(false);
          return;
      }
    }

    const actionsQuery = query(actionsCollectionRef, ...queryFilters);

    const unsubscribe = onSnapshot(actionsQuery, async (querySnapshot) => {
      try {
        const userData = await Promise.all(
          querySnapshot.docs.map(async (doc) => {
            const item = doc.data();
            const user = await getUserData(item.assignee);
            return {
              ...item,
              user: user ?? { name: '', lastName: '' },
            };
          })
        );
        setData(userData);
        setTotalActions(querySnapshot.size);
        setLoading(false);
      } catch (error) {
        console.error('Error processing snapshot:', error);
        setError(error);
        setLoading(false);
      }
    });

    // Return unsubscribe function so you can call it when needed
    return unsubscribe;
  };

  useEffect(() => {
    if (organization && teamId) fetchData(assigneeFilter, dateFilter);
    else setLoading(false);
  }, [organization]);

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

  const refetch = (assigneeFilter: string, dateFilter: string) => {
    setLoading(true);
    fetchData(assigneeFilter, dateFilter);
  };

  return { loading, data, error, refetch, totalActions };
}

export default useFetchActions;
