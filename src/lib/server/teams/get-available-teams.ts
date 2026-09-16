import { useEffect, useState } from 'react';
import { useFirestore } from 'reactfire';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { ORGANIZATIONS_COLLECTION } from '~/lib/firestore-collections';

function useFetchAvailableTeams(organizationId: string, userId: string) {
  const firestore = useFirestore();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[] | null>(null);
  const [error, setError] = useState<any | null>(null);

  useEffect(() => {
    if (!organizationId) return;

    const teamsCollectionRef = collection(
      firestore,
      ORGANIZATIONS_COLLECTION,
      organizationId,
      'teams',
    );
    const teamsQuery = query(teamsCollectionRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      teamsQuery,
      async (querySnapshot) => {
        const teams = [];

        for (const teamDoc of querySnapshot.docs) {
          const teamData = teamDoc.data();
          const teamId = teamDoc.id;

          const usersCollectionRef = collection(teamDoc.ref, 'users');
          const usersQuery = query(
            usersCollectionRef,
            where('userId', '==', userId),
            where('active', '==', true),
          );
          const currentUsersQuerySnapshot = await getDocs(usersQuery);

          if (!currentUsersQuerySnapshot.empty) {
            const userDoc = currentUsersQuerySnapshot.docs[0];
            const userData = userDoc.data();

            teams.push({ id: teamId, ...teamData, user: userData, organizationId });
          }
        }

        setData(teams);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching teams:', error);
        setError(error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [organizationId, userId, firestore]);

  return { loading, data, error };
}

export default useFetchAvailableTeams;
