import { useEffect, useState } from 'react';
import { useFirestore } from 'reactfire';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

function useFetchTeamByUser(organizationId: any, teamId: string, userId: any) {
  const firestore = useFirestore();

  const teamsCollectionPath = `organizations/${organizationId}/teams`;
  const teamsCollectionRef = collection(firestore, teamsCollectionPath);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<any | null>(null);

  const fetchData = async () => {
    if (organizationId == null || teamId == null || userId == null) {
      setLoading(false);
      return;
    }
    try {
      // Use a query to filter by teamId
      const q = query(teamsCollectionRef, where('id', '==', teamId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const teamDoc = querySnapshot.docs[0];

        const usersCollectionRef = collection(teamDoc.ref, 'users');
        const q = query(usersCollectionRef, where('userId', '==', userId));

        const usersQuerySnapshot = await getDocs(q);

        if (!usersQuerySnapshot.empty) {
          const userDoc = usersQuerySnapshot.docs[0];
          const userData = userDoc.data();

          setData(userData.role);
        } else {
          setError('No users found in the team.');
        }
      } else {
        setError('Team not found.');
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching member:', error);
      setError(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId && teamId && userId) {
      fetchData();
    }
  }, [organizationId, teamId, userId]);

  const refetch = () => {
    setLoading(true);
    fetchData();
  };

  return { loading, data, error, refetch };
}

export default useFetchTeamByUser;
