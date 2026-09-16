import { useEffect, useState } from 'react';
import { useFirestore } from 'reactfire';
import { collection, getDoc, getDocs } from 'firebase/firestore';

function useFetchTeamMembers(organizationId: string, teamId: any) {
  const firestore = useFirestore();

  const teamsCollectionPath = `organizations/${organizationId}/teams/${teamId}/users`;
  const teamsCollectionRef = collection(firestore, teamsCollectionPath);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[] | null>(null);
  const [error, setError] = useState<any | null>(null);

  const fetchData = async () => {
    try {
      const querySnapshot = await getDocs(teamsCollectionRef);
      const userData = [];

      for (const docSnapshot of querySnapshot.docs) {
        const item = docSnapshot.data();
        const data = await getUserData(item.user);
        if (data) {
          userData.push({ ...item, data });
        } else {
          const user = { name: '', lastName: '' };
          userData.push({ ...item, user });
        }
      }
      setData(userData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching team members:', error);
      setError(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId && teamId) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [organizationId, teamId]);

  const refetch = () => {
    setLoading(true);
    fetchData();
  };

  const getUserData = async (userRef: any) => {
    const userDocSnapshot = await getDoc(userRef);
    if (userDocSnapshot.exists()) {
      return userDocSnapshot.data() as any;
    }
    return null;
  };

  return { loading, data, error, refetch };
}

export default useFetchTeamMembers;
