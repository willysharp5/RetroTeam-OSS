import { collection, getDoc, doc } from 'firebase/firestore';
import { useCallback, useState, useEffect } from 'react';
import { useFirestore } from 'reactfire';
import { ORGANIZATIONS_COLLECTION } from '~/lib/firestore-collections';
import { RETROSPECTIVES_COLLECTION } from '~/lib/firestore-collections';
import { Retrospectives } from '../types/retrospectives';

export function useGetRetrospectivesById(
  organizationId: string,
  retrospectiveId: string,
) {
  const firestore = useFirestore();
  const retrospectivesCollectionPath = `${ORGANIZATIONS_COLLECTION}/${organizationId}/${RETROSPECTIVES_COLLECTION}`;
  const retrospectivesCollection = collection(
    firestore,
    retrospectivesCollectionPath,
  );
  const [retrospective, setRetrospective] = useState<Retrospectives | any>();
  const [boardMembers, setMembers] = useState();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRetrospectives = useCallback(async () => {
    try {
      setLoading(true);

      // Initialize the query with organizationId and retrospective id
      const retrospectiveRef = doc(retrospectivesCollection, retrospectiveId);
      const querySnapshot = await getDoc(retrospectiveRef);
      const userData = [] as any;
      if (querySnapshot.exists()) {
        const newRetrospectivesData = querySnapshot.data();

        const members = newRetrospectivesData.members;
        const getUserInfo = async () => {
          const memberValues = Object.values(members) as any;

          for (const user of memberValues) {
            const userInfo = await getUserData(user.user);

            if (userInfo) {
              userInfo.role = user.role;
              userInfo.active = user.active;
              userInfo.userId = user.userId;
              userData.push(userInfo);
            }
          }
        };
        //Get user data from users collection
        await getUserInfo();

        setMembers(userData);
        // Update the state with the new data
        setRetrospective(newRetrospectivesData);
      }
      setError(null);
    } catch (error: any) {
      console.error('Error fetching retrospectives:', error);
      setRetrospective([]);
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [retrospectivesCollection, retrospectiveId]);

  useEffect(() => {
    // Fetch retrospectives when the component mounts or when organizationId / retrospectiveId changes
    if (organizationId && retrospectiveId) fetchRetrospectives();
  }, [organizationId, retrospectiveId]);

  const getUserData = async (userRef: any) => {
    const userDocSnapshot = await getDoc(userRef);
    if (userDocSnapshot.exists()) {
      return userDocSnapshot.data() as any;
    }
    return null;
  };

  return {
    retrospective,
    loading,
    error,
    fetchRetrospectives,
    members: boardMembers,
  };
}
