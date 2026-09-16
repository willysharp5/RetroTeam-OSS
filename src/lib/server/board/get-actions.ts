import { useEffect, useState } from 'react';
import { useFirestore } from 'reactfire';
import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  where,
  getDoc,
} from 'firebase/firestore';
import { USERS_COLLECTION } from '~/lib/firestore-collections';

function useFetchActions(
  organization: string,
  teamId: string,
  retrospectiveId: string,
  assigneeFilter?: string,
  dateFilter?: string,
) {
  const firestore = useFirestore();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[] | null>(null);
  const [error, setError] = useState<any | null>(null);

  const fetchData = (assigneeFilter?: string, dateFilter?: string) => {
    try {
      const actionsCollectionPath = `organizations/${organization}/board/${retrospectiveId}/actions`;
      const actionsCollectionRef = collection(firestore, actionsCollectionPath);
      const queryFilters = [];
      queryFilters.push(orderBy('order'));

      if (assigneeFilter) {
        if (assigneeFilter !== 'Any member') {
          queryFilters.push(where('assignee', '==', assigneeFilter));
        }
      }
      if (dateFilter) {
        if (dateFilter !== 'Filter by date') {
          switch (dateFilter) {
            case 'No due date':
              queryFilters.push(where('date', '==', null));
              break;
            case 'Recent':
              queryFilters.push(orderBy('date', 'asc'));
              break;
            case 'Overdue':
              // This case will be handled inside the snapshot listener
              break;
            default:
              console.error('Invalid dateFilter value');
              setError('Invalid dateFilter value');
              setLoading(false);
              return;
          }
        }
      }

      const actionsQuery = query(actionsCollectionRef, ...queryFilters);

      const unsubscribe = onSnapshot(
        actionsQuery,
        async (querySnapshot) => {
          const userData = [];

          for (const docSnapshot of querySnapshot.docs) {
            const item = docSnapshot.data();
            if (dateFilter === 'Overdue') {
              const now = new Date().toISOString();
              const isOverdue =
                item.date != null && item.date !== '' && item.date < now;
              if (isOverdue) {
                const user = await getUserData(item.author);
                if (user) {
                  user.id = item.author;
                  userData.push({ ...item, user });
                } else {
                  const user = { name: '', lastName: '' };
                  userData.push({ ...item, user });
                }
              }
            } else {
              const user = await getUserData(item.author);
              if (user) {
                user.id = item.author;
                userData.push({ ...item, user });
              } else {
                const user = { name: '', lastName: '' };
                userData.push({ ...item, user });
              }
            }
          }

          setData(userData);
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching documents:', error);
          setError(error);
          setLoading(false);
        }
      );

      // Cleanup the listener on component unmount
      return () => unsubscribe();
    }
    catch (e) {

    }
  }
  useEffect(() => {
    if (organization && teamId && retrospectiveId) {
      fetchData(assigneeFilter, dateFilter)
    }
  }, [organization, teamId, retrospectiveId, assigneeFilter, dateFilter]);

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

  return { loading, data, error, refetch: fetchData};
}

export default useFetchActions;
