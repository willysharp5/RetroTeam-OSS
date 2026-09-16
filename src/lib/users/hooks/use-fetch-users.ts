import { collection, doc, onSnapshot } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { useFirestore } from 'reactfire';
import { USERS_COLLECTION } from '~/lib/firestore-collections';

export function useFetchUser(userId: string, type: string) {
  const firestore = useFirestore();
  const usersCollectionPath = `${USERS_COLLECTION}`;
  const usersCollection = collection(firestore, usersCollectionPath);

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    console.log("userId", userId, type)
    if (!userId) {
      setUser(null);
      setLoading(false);
      return;
    }

    const userRef = doc(usersCollection, userId);

    const unsubscribe = onSnapshot(
      userRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          setUser(docSnapshot.data());
          setError(null);
        } else {
          setUser(null);
          setError(new Error(`User with ID ${userId} not found.`));
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to user document:', error);
        setError(error);
        setUser(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, usersCollection]);

  return {
    user,
    loading,
    error,
  };
}
