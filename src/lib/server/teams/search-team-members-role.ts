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

function useSearchTeamMembersRole(
  organizationId: string,
  teamId: string,
  name: string,
  role: number,
) {
  const firestore = useFirestore();
  const teamsCollectionPath = `organizations/${organizationId}/teams/${teamId}/users`;
  const teamsCollectionRef = collection(firestore, teamsCollectionPath);
  const usersCollectionRef = collection(firestore, 'users');

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>([]);
  const [error, setError] = useState<any>(null);

  async function getUserNameFromReference(userRef: any) {
    const nameDocSnapshot = await getDoc(userRef);
    if (nameDocSnapshot.exists()) {
      const userData: any = nameDocSnapshot.data();
      return userData.name + ' ' + userData.lastName;
    }
    return null;
  }

  const fetchData = async (name: string) => {
    console.log('name', name, role);
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
          const teamQuery = query(
            teamsCollectionRef,
            where('userId', 'in', userIds),
            where('role', '==', role),
          );
          const teamQuerySnapshot = await getDocs(teamQuery);

          if (!teamQuerySnapshot.empty) {
            const usersDataPromises = teamQuerySnapshot.docs.map(
              async (docSnapshot) => {
                const userData = await getUserNameFromReference(
                  docSnapshot.data().user,
                );
                return userData
                  ? {
                      id: docSnapshot.id,
                      name: userData,
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
        //Show 5 users
        const teamQuery = query(
          teamsCollectionRef,
          where('role', '==', role),
          limit(5),
        );
        const teamQuerySnapshot = await getDocs(teamQuery);

        if (!teamQuerySnapshot.empty) {
          const usersDataPromises = teamQuerySnapshot.docs.map(
            async (docSnapshot) => {
              const userData = await getUserNameFromReference(
                docSnapshot.data().user,
              );

              return userData
                ? {
                    id: docSnapshot.id,
                    name: userData,
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
      fetchData(name);
    } else {
      setLoading(false);
    }
  }, [organizationId, teamId, name, role]);

  const refetch = (searchName: string, role: number) => {
    fetchData(searchName);
  };

  return { loading, data, error, refetch };
}

export default useSearchTeamMembersRole;
