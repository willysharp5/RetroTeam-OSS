import { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  limit,
  query,
  where,
} from 'firebase/firestore';
import { useFirestore } from 'reactfire';

import { useApiRequest } from '~/core/hooks/use-api';

/**
 * @name useFetchOrganizationTeamMembersMetadata
 * @param organizationId
 * @param teamId
 */
export function useFetchOrganizationTeamMembersMetadata(
  organizationId: string,
  teamId: string,
  limitNumber: any,
) {
  const firestore = useFirestore();
  const teamsCollectionPath = `organizations/${organizationId}/teams/${teamId}/users`;
  const teamsCollectionRef = collection(firestore, teamsCollectionPath);
  const usersCollectionRef = collection(firestore, 'users');

  const [loading, setLoading] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [data, setData] = useState<any>([]);
  const [error, setError] = useState<any | null>(null);
  const fetcher = useApiRequest<Record<string, unknown>[]>();

  const fetchMetaData = async (userId: string) => {
    const endpoint = getFetchMembersPath(organizationId, userId);
    return fetcher({ path: endpoint, method: 'GET' });

    function getFetchMembersPath(organizationId: string, userId: string) {
      return `/api/organizations/${organizationId}/${teamId}/team-members?userId=${userId}`;
    }
  };

  const fetchData = async (limitNumber: any) => {
    if (!organizationId || !teamId) {
      setLoading(false);
      return;
    }
    try {
      let pagedMembersQuery = query(
        teamsCollectionRef,
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

            if (user?.userId) {

              const metaData = await fetchMetaData(user.userId);

              if (metaData) {
                userData.push(...metaData);
              }
            }
          }),
        );

        setData(userData);
        setLoading(false);
      } else {
        setError('No active users found in the team.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching team:', error);
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
        ).filter((id): id is string => id != null && id !== '');
        if (userIds.length > 0) {
          const teamQuery = query(
            teamsCollectionRef,
            where('userId', 'in', userIds),
          );
          const teamQuerySnapshot = await getDocs(teamQuery);

          if (!teamQuerySnapshot.empty) {
            const usersDataPromises = teamQuerySnapshot.docs.map(
              async (docSnapshot) => {
                const user = docSnapshot.data();
                
                  console.log("user?.userId", user?.userId)
                if (user?.userId) {
                  const metaData = await fetchMetaData(user.userId);
                  if (metaData) {
                    return metaData;
                  }
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
                  console.log('User not found on the team');
                }
              })

              .catch((error) => {
                setLoadingSearch(false);
                console.error('Error:', error);
                setError(error);
                setLoadingSearch(false);
              });
          } else {
            console.log('User not found on the team');
            setLoadingSearch(false);
          }
        } else {
          setData([]);
          console.log('Username not found');
          setLoadingSearch(false);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching team members:', error);
        setError(error);
        setLoadingSearch(false);
      }
    } else {
      fetchData(limitNumber);
      setLoadingSearch(false);
    }
  };

  useEffect(() => {
    if (organizationId && teamId) {
      fetchData(limitNumber);
    } else {
      setLoading(false);
    }
  }, [organizationId, teamId]);

  return { loading, data, error, searchMembers, loadingSearch };
}
