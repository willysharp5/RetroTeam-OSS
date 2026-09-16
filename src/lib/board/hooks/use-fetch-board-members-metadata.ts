import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from 'firebase/firestore';
import { useFirestore } from 'reactfire';
import { USERS_COLLECTION } from '~/lib/firestore-collections';

/**
 * @name useFetchBoardMembersMetadata
 * @param organizationId
 * @param retrospectiveId
 * @param limitNumber
 */
export function useFetchBoardMembersMetadata(
  organizationId: string,
  retrospectiveId: string,
  limitNumber: any,
) {
  const firestore = useFirestore();
  const retrospectivesCollectionPath = `organizations/${organizationId}/retrospectives/${retrospectiveId}/users`;
  const retrospectivesCollectionRef = collection(
    firestore,
    retrospectivesCollectionPath,
  );
  const usersCollectionRef = collection(firestore, 'users');

  const [loading, setLoading] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const [data, setData] = useState<any>([]);
  const [error, setError] = useState<any | null>(null);

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

  const fetchData = async (limitNumber: any) => {
    try {
      let pagedMembersQuery = query(
        retrospectivesCollectionRef,
        where('active', '==', true),
      );

      if (limitNumber != '') {
        pagedMembersQuery = query(pagedMembersQuery, limit(limitNumber));
      }

      const querySnapshot = await getDocs(query(pagedMembersQuery));

      const userData = [] as any[];

      if (!querySnapshot.empty) {
        await Promise.all(
          querySnapshot.docs.map(async (doc) => {
            const user = doc.data();
            const metaData = await getUserData(user.userId);
            if (metaData) {
              metaData.userId = user.userId;
              metaData.id = user.userId;
              metaData.role = user.role
              userData.push(metaData);
            }
          }),
        );

        setData(userData);
        setLoading(false);
      } else {
        setError('No active users found in the board.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching board:', error);
      setError(error);
      setLoading(false);
    }
  };

  const searchMembers = async (searchableText: string) => {
    
    if (searchableText !== '' && typeof searchableText === 'string') {
      setLoadingSearch(true);
      try {
        const search = searchableText.replace(/\s+/g, '').toLowerCase();

        // Search users by name
        const userQueryByName = query(
          usersCollectionRef,
          where('searchableName', '>=', search),
          where('searchableName', '<=', search + '~'),
        );

        // Search users by lastName
        const userQueryByLastName = query(
          usersCollectionRef,
          where('searchableLastName', '>=', search),
          where('searchableLastName', '<=', search + '~'),
        );

        const [userQueryByNameSnapshot, userQueryByLastNameSnapshot] =
          await Promise.all([
            getDocs(userQueryByName),
            getDocs(userQueryByLastName),
          ]);

        const userIdsByName = userQueryByNameSnapshot.docs.map(
          (userDoc) => userDoc.id,
        );
        const userIdsByLastName = userQueryByLastNameSnapshot.docs.map(
          (userDoc) => userDoc.id,
        );
        const userIds = Array.from(
          new Set([...userIdsByName, ...userIdsByLastName]),
        );
        if (userIds.length > 0) {
          const boardQuery = query(
            retrospectivesCollectionRef,
            where('userId', 'in', userIds),
          );
          const boardQuerySnapshot = await getDocs(boardQuery);

          if (!boardQuerySnapshot.empty) {
            const usersDataPromises = boardQuerySnapshot.docs.map(
              async (docSnapshot) => {
                const user = docSnapshot.data();
                const metaData = await getUserData(user.userId);
                if (metaData) {
                  metaData.userId = user.userId;
                  metaData.id = user.userId;
                  return metaData;
                }
              },
            );

            Promise.all(usersDataPromises)
              .then((usersData) => {
                const filteredUsersData = usersData.filter(
                  (userData) => userData !== null,
                );
                if (filteredUsersData.length > 0) {
                  const mergedArray = filteredUsersData.flatMap(
                    (innerArray) => innerArray,
                  );
                  setData(mergedArray);
                  setLoadingSearch(false);
                } else {
                  setLoadingSearch(false);
                  console.log('User not found on the board');
                }
              })

              .catch((error) => {
                setLoadingSearch(false);
                console.error('Error:', error);
                setError(error);
                setLoadingSearch(false);
              });
          } else {
            console.log('User not found on the board');
            setLoadingSearch(false);
          }
        } else {
          setData([]);
          console.log('Username not found');
          setLoadingSearch(false);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching board members:', error);
        setError(error);
        setLoadingSearch(false);
      }
    } else {
      fetchData(limitNumber);
      setLoadingSearch(false);
    }
  };

  useEffect(() => {
    if (organizationId && retrospectiveId) {
      fetchData(limitNumber);
    } else {
      setLoading(false);
    }
  }, [organizationId, retrospectiveId]);

  return { loading, data, error, searchMembers, loadingSearch };
}
