import { useEffect, useState } from 'react';
import { useFirestore } from 'reactfire';
import { doc, getDoc } from 'firebase/firestore';
import { USERS_COLLECTION } from '~/lib/firestore-collections';

function useFetchUserById(userId: string) {
  const firestore = useFirestore();

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any | null>(null);
  const [error, setError] = useState<any | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const userRef = doc(firestore, USERS_COLLECTION, userId);

      try {
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserData(userData);
          setLoading(false);
        } else {
          setError('User not found');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError(error);
        setLoading(false);
      }
    };
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  return userData;
}

export default useFetchUserById;
