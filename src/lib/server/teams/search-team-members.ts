import { useEffect, useState } from 'react';
import { useFirestore } from 'reactfire';
import {
  collection,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from 'firebase/firestore';

function useSearchTeamMembers(
  organizationId: string,
  teamId: any,
  name: string,
  number: number,
) {
  const firestore = useFirestore();
  const teamsCollectionPath = `organizations/${organizationId}/teams/${teamId}/users`;
  const teamsCollectionRef = collection(firestore, teamsCollectionPath);
  const usersCollectionRef = collection(firestore, 'users');

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>([]);
  const [error, setError] = useState<any>(null);

  async function getUserNameFromReference(userRef: any, role: number) {
    const nameDocSnapshot = await getDoc(userRef);
    if (nameDocSnapshot.exists()) {
      const userData: any = nameDocSnapshot.data();
      return {
        name: userData.name,
        lastName: userData.lastName,
        email: userData.email,
        role,
      };
    }
    return null;
  }

  const fetchData = async (name: string, number: number) => {
    if (name !== '') {
      try {
        const search = name.replace(/\s+/g, '').toLowerCase();

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

        // Search users by email
        const userQueryByEmail = query(
          usersCollectionRef,
          where('email', '>=', search),
          where('email', '<=', search + '~'),
        );

        const [
          userQueryByNameSnapshot,
          userQueryByLastNameSnapshot,
          userQueryByEmailSnapshot,
        ] = await Promise.all([
          getDocs(userQueryByName),
          getDocs(userQueryByLastName),
          getDocs(userQueryByEmail),
        ]);

        const userIdsByName = userQueryByNameSnapshot.docs.map(
          (userDoc) => userDoc.id,
        );
        const userIdsByLastName = userQueryByLastNameSnapshot.docs.map(
          (userDoc) => userDoc.id,
        );
        const userIdsByEmail = userQueryByEmailSnapshot.docs.map(
          (userDoc) => userDoc.id,
        );

        const userIds = Array.from(
          new Set([
            ...userIdsByName,
            ...userIdsByLastName,
            ...userIdsByEmail.flat(),
          ]),
        );

        if (userIds.length > 0) {
          const teamQuery = query(
            teamsCollectionRef,
            where('userId', 'in', userIds),
            limit(number),
          );
          const teamQuerySnapshot = await getDocs(teamQuery);

          if (!teamQuerySnapshot.empty) {
            const usersDataPromises = teamQuerySnapshot.docs.map(
              async (docSnapshot) => {
                const userData = await getUserNameFromReference(
                  docSnapshot.data().user,
                  docSnapshot.data().role,
                );
                return userData
                  ? {
                      id: docSnapshot.id,
                      name: userData.name,
                      lastName: userData.lastName,
                      email: userData.email,
                      role: docSnapshot.data().role,
                    }
                  : null;
              },
            );

            Promise.all(usersDataPromises)
              .then((usersData) => {
                const filteredUsersData = usersData.filter(
                  (userData) => userData !== null,
                );
                if (filteredUsersData.length > 0) {
                  setData(filteredUsersData);
                } else {
                  console.log('User not found on the team');
                  setLoading(false);
                }
              })
              .catch((error) => {
                console.error('Error:', error);
                setError(error);
                setLoading(false);
              });
          } else {
            console.log('User not found on the team');
            setLoading(false);
          }
        } else {
          setData([]);
          console.log('Username not found');
          setLoading(false);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching team members:', error);
        setError(error);
        setLoading(false);
      }
    } else {
      try {
        const teamQuery = query(teamsCollectionRef, limit(number));
        const teamQuerySnapshot = await getDocs(teamQuery);

        if (!teamQuerySnapshot.empty) {
          const usersDataPromises = teamQuerySnapshot.docs.map(
            async (docSnapshot) => {
              const userData = await getUserNameFromReference(
                docSnapshot.data().user,
                docSnapshot.data().role,
              );

              return userData
                ? {
                    id: docSnapshot.id,
                    name: userData.name,
                    lastName: userData.lastName,
                    email: userData.email,
                    role: docSnapshot.data().role,
                  }
                : null;
            },
          );

          const usersData = await Promise.all(usersDataPromises);
          setData(usersData);
          setLoading(false);
        } else {
          setData([]);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching team members:', error);
        setError(error);
        setLoading(false);
      }
    }
  };
  useEffect(() => {
    if (organizationId && teamId) {
      fetchData(name, number);
    } else {
      setLoading(false);
    }
  }, [organizationId, teamId, name, number]);

  const search = (searchName: string, number: number) => {
    fetchData(searchName, number);
  };

  return { loading, data, error, search };
}

export default useSearchTeamMembers;
