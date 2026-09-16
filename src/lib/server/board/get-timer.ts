import { useEffect, useState } from 'react';
import { useFirestore } from 'reactfire';
import {
  collection,
  query,
  onSnapshot,
} from 'firebase/firestore';

function useFetchTimer(organization: string, retrospectiveId: string) {
  const firestore = useFirestore();
  const timerCollectionPath = `organizations/${organization}/retrospectives/${retrospectiveId}/timer`;
  const timerCollectionRef = collection(firestore, timerCollectionPath);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<any | null>(null);

  useEffect(() => {
    if (!organization || !retrospectiveId) return;

    const timerQuery = query(timerCollectionRef);

    const unsubscribe = onSnapshot(
      timerQuery,
      (querySnapshot) => {
        if (!querySnapshot.empty) {
          const timerData = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          if (timerData.length > 0) {
            setData(timerData[0]);
          }
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching documents:', error);
        setError(error);
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [organization, retrospectiveId, firestore]);

  return { data, loading, error };
}

export default useFetchTimer;
