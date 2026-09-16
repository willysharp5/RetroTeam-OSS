import { useState } from 'react';
import { useFirestore } from 'reactfire';
import { doc, updateDoc } from 'firebase/firestore';
import { useUser } from 'reactfire';
import { USERS_COLLECTION } from '~/lib/firestore-collections';

function useUpdateCurrentUser() {
  const { data: user } = useUser();
  const userId = user?.uid as string;

  const firestore = useFirestore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);

  const updateUserData = async (info: any) => {
    const userRef = doc(firestore, USERS_COLLECTION, userId);

    if (info.name && info.lastName) {
      info.fullName = `${info.name} ${info.lastName}`;
      info.searchableName =
        info.name?.toLowerCase() + info.lastName?.toLowerCase();
      info.searchableLastName = info.lastName.toLowerCase();
    }

    try {
      await updateDoc(userRef, info);
      console.log('User data updated successfully');
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  return { updateUserData, loading, error };
}

export default useUpdateCurrentUser;
