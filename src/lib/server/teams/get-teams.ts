import { useCallback, useState, useEffect } from 'react';
import { useFirestore } from 'reactfire';
import {
  collection,
  query,
  where,
  orderBy,
  startAfter,
  limit,
  getDocs,
  doc,
} from 'firebase/firestore';
import {
  ORGANIZATIONS_COLLECTION,
  RETROSPECTIVES_COLLECTION,
  TEAMS_COLLECTION,
} from '~/lib/firestore-collections';
import { MembershipRole } from '~/lib/organizations/types/membership-role';

export function useFetchTeams(
  organizationId: string,
  userId: string,
  pageSize: number,
  text: string,
  sorted: string,
  selectedTeam?: string,
) {
  const firestore = useFirestore();

  const [data, setData] = useState<any[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);

  const [error, setError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalTeams, setTotalTeams] = useState(0);

  const fetchData = useCallback(
    async (page: number) => {
      try {
        const teamsCollection = collection(
          firestore,
          ORGANIZATIONS_COLLECTION,
          organizationId,
          TEAMS_COLLECTION,
        );
        // setLoading(true);

        // Calculate the startAt value based on the page number and page size
        const startAtIndex = (page - 1) * pageSize;

        const teams = [] as any[];

        const userPath = `members.${userId}`;

        let q = query(
          teamsCollection,
          orderBy(userPath), // Order by the field with the inequality filter
          where(userPath, '!=', null),
        );

        // If not the first page, use startAfter to paginate
        if (startAtIndex > 0) {
          const querySnapshot = await getDocs(q);
          const lastTeam = querySnapshot.docs[startAtIndex - 1];
          q = query(q, startAfter(lastTeam));
        }

        // Limit the results to the specified pageSize
        q = query(q, limit(pageSize));

        const querySnapshot = await getDocs(q);

        let teamsAdded = 0;
        
        for (const teamDoc of querySnapshot.docs) {
          const teamData = teamDoc.data();
          const teamId = teamDoc.id;

          const teamRef = doc(firestore, ORGANIZATIONS_COLLECTION, organizationId, "teams", teamId);

          //Count how many retrospectives does the team have
          const retrospectivesCollection = collection(
            firestore,
            ORGANIZATIONS_COLLECTION,
            organizationId,
            RETROSPECTIVES_COLLECTION,
          );
          let retroQuery = query(
            retrospectivesCollection,
            where('team', '==', teamRef),
            where('archived', '==', false),
          );

          const retrospectivesSnapshot = await getDocs(retroQuery);
          const retrospectivesCount = retrospectivesSnapshot.size;

          // Check if the user belongs to the team
          const usersCollectionRef = collection(teamDoc.ref, 'users');
          let usersQuery = query(
            usersCollectionRef,
            where('userId', '==', userId),
            where('active', '==', true),
          );

          const currentUsersQuerySnapshot = await getDocs(usersQuery);

          const userDoc = currentUsersQuerySnapshot.docs[0];
          const userData = userDoc.data();

          let members = 0;

          if (!currentUsersQuerySnapshot.empty) {
            const usersQuerySnapshot = await getDocs(usersCollectionRef);
            if (!usersQuerySnapshot.empty) {
              members = usersQuerySnapshot.size;
            }
            if (selectedTeam) {
              if (selectedTeam !== teamId) {
                teams.push({
                  id: teamId,
                  ...teamData,
                  members,
                  user: userData,
                  membersArray: teamData.members,
                  retrospectivesCount
                });
                teamsAdded++;
              }
            } else {
              teams.push({
                id: teamId,
                ...teamData,
                members,
                user: userData,
                membersArray: teamData.members,
                retrospectivesCount
              });
              teamsAdded++;
            }
          }
        }
        // Update the state with the new data
        setData(teams);
        setError(null);

        // Calculate the total number of pages based on the total number of retrospectives for the organization
        const totalQuery = query(teamsCollection, where(userPath, '!=', null));

        const totalTeams = await getDocs(totalQuery);
        const totalPages = Math.ceil(totalTeams.size / pageSize);
        
        setTotalPages(totalPages);
        setTotalTeams(totalTeams.size);

        setCurrentPage(page);
      } catch (error: any) {
        console.error('Error fetching teams:', error);
        setData([]);
        setError(error);
      } finally {
        setLoading(false);
      }
    },
    [userId, pageSize, selectedTeam, firestore, organizationId],
  );

  const sortData = useCallback(
    async (page: number, type: string, lastId: string) => {
      try {
        const teamsCollection = collection(
          firestore,
          ORGANIZATIONS_COLLECTION,
          organizationId,
          TEAMS_COLLECTION,
        );
        // setLoading(true);
        // Calculate the startAt value based on the page number and page size
        const startAtIndex = (page - 1) * pageSize;

        const teams = [] as any[];

        const userPath = `members.${userId}`;
        let q = query(teamsCollection);

        if (type === 'ascending') {
          q = query(q, orderBy('name', 'asc'));
        } else {
          q = query(q, orderBy('name', 'desc'));
        }

        // If not the first page, use startAfter to paginate
        if (startAtIndex > 0) {
          const querySnapshot = await getDocs(q);
          if (lastId === '') {
            const lastTeam = querySnapshot.docs[startAtIndex - 1];
            q = query(q, startAfter(lastTeam));
          } else {
            q = query(q, startAfter(lastId));
          }
        }

        const querySnapshot = await getDocs(q);

        let teamsAdded = 0;

        for (const teamDoc of querySnapshot.docs) {
          const teamData = teamDoc.data();
          const teamId = teamDoc.id;

          const isActive = teamData.members[userId];

          if (isActive) {
            // Check if the user belongs to the team
            const usersCollectionRef = collection(teamDoc.ref, 'users');
            const usersQuery = query(
              usersCollectionRef,
              where('userId', '==', userId),
              where('active', '==', true),
            );

            const currentUsersQuerySnapshot = await getDocs(usersQuery);

            const userDoc = currentUsersQuerySnapshot.docs[0];
            const userData = userDoc.data();
            let members = 0;

            const usersQuerySnapshot = await getDocs(usersCollectionRef);
            if (!usersQuerySnapshot.empty) {
              members = usersQuerySnapshot.size;
            }

            // Limit the results to the specified pageSize
            if (pageSize > teamsAdded) {
              teams.push({ id: teamId, ...teamData, members, user: userData });
              teamsAdded++;
            }
          }
        }

        // Update the state with the new data
        setData(teams);
        setError(null);

        // Calculate the total number of pages based on the total number of retrospectives for the organization
        const totalQuery = query(teamsCollection, where(userPath, '!=', null));

        const totalTeams = await getDocs(totalQuery);
        const totalPages = Math.ceil(totalTeams.size / pageSize);
        setTotalPages(totalPages);
        setTotalTeams(totalTeams.size);

        setCurrentPage(page);
      } catch (error: any) {
        console.error('Error fetching teams:', error);
        setData([]);
        setError(error);
      } finally {
        setLoading(false);
      }
    },
    [userId, pageSize, firestore, organizationId],
  );

  const search = useCallback(
    async (page: number, text: string) => {
      try {
        const teamsCollection = collection(
          firestore,
          ORGANIZATIONS_COLLECTION,
          organizationId,
          TEAMS_COLLECTION,
        );
         setLoadingSearch(true);
        const search = text?.replace(/\s+/g, '').toLowerCase();
        // Calculate the startAt value based on the page number and page size
        const startAtIndex = (page - 1) * pageSize;

        const teams = [] as any[];

        let q = query(
          teamsCollection,
          orderBy('searchableName', 'asc'),
          where('searchableName', '>=', search),
          where('searchableName', '<=', search + '\uf8ff'),
        );

        // If not the first page, use startAfter to paginate
        if (startAtIndex > 0) {
          const querySnapshot = await getDocs(q);
          const lastTeam = querySnapshot.docs[startAtIndex - 1];
          q = query(q, startAfter(lastTeam));
        }

        // Limit the results to the specified pageSize
        q = query(q, limit(pageSize));

        const querySnapshot = await getDocs(q);

        let teamsAdded = 0;

        for (const teamDoc of querySnapshot.docs) {
          const teamData = teamDoc.data();
          const teamId = teamDoc.id;

          const isActive = teamData.members[userId];

          const teamRef = doc(firestore, ORGANIZATIONS_COLLECTION, organizationId, "teams", teamId);
          
          //Count how many retrospectives does the team have
          const retrospectivesCollection = collection(
            firestore,
            ORGANIZATIONS_COLLECTION,
            organizationId,
            RETROSPECTIVES_COLLECTION,
          );
          let retroQuery = query(
            retrospectivesCollection,
            where('team', '==', teamRef),
            where('archived', '==', false),
          );

          const retrospectivesSnapshot = await getDocs(retroQuery);
          const retrospectivesCount = retrospectivesSnapshot.size;

          if (isActive) {
            // Check if the user belongs to the team
            const usersCollectionRef = collection(teamDoc.ref, 'users');
            const usersQuery = query(
              usersCollectionRef,
              where('userId', '==', userId),
              where('active', '==', true),
            );

            const currentUsersQuerySnapshot = await getDocs(usersQuery);

            const userDoc = currentUsersQuerySnapshot.docs[0];
            const userData = userDoc.data();
            let members = 0;

            const usersQuerySnapshot = await getDocs(usersCollectionRef);
            if (!usersQuerySnapshot.empty) {
              members = usersQuerySnapshot.size;
            }

            teams.push({ id: teamId, ...teamData, members, user: userData, retrospectivesCount});
            teamsAdded++;
          }
        }

        // Update the state with the new data
        setData(teams);
        setError(null);

        // Calculate the total number of pages based on the total number of retrospectives for the organization
        const totalQuery = query(
          teamsCollection,
          orderBy('searchableName', 'asc'),
          where('searchableName', '>=', search),
          where('searchableName', '<=', search + '\uf8ff'),
        );

        const totalTeams = await getDocs(totalQuery);
        const totalPages = Math.ceil(totalTeams.size / pageSize);
        setTotalPages(totalPages);
        setTotalTeams(totalTeams.size);

        setCurrentPage(page);
      } catch (error: any) {
        console.error('Error fetching teams:', error);
        setData([]);
        setError(error);
      } finally {
        setLoadingSearch(false);
      }
    },
    [userId, pageSize, firestore, organizationId],
  );

  const dropdownSearch = useCallback(
    async (text: string) => {
      if (text === '') {
        fetchData(1);
      } else {
        setLoadingSearch(true);
        try {
          const teamsCollection = collection(
            firestore,
            ORGANIZATIONS_COLLECTION,
            organizationId,
            TEAMS_COLLECTION,
          );
          // setLoading(true);
          const search = text?.replace(/\s+/g, '').toLowerCase();

          const teams = [] as any[];

          let q = query(
            teamsCollection,
            orderBy('searchableName', 'asc'),
            where('searchableName', '>=', search),
            where('searchableName', '<=', search + '\uf8ff'),
          );

          const querySnapshot = await getDocs(q);

          let teamsAdded = 0;

          for (const teamDoc of querySnapshot.docs) {
            const teamData = teamDoc.data();
            const teamId = teamDoc.id;

            const isActive = teamData.members[userId];

            if (isActive) {
              const AdminRole = MembershipRole.Admin;

              // Check if the user belongs to the team
              const usersCollectionRef = collection(teamDoc.ref, 'users');
              const usersQuery = query(
                usersCollectionRef,
                where('userId', '==', userId),
                where('active', '==', true),
              );
              const q = query(usersQuery, where('role', '==', AdminRole));
              const currentUsersQuerySnapshot = await getDocs(q);

              const userDoc = currentUsersQuerySnapshot.docs[0];
              const userData = userDoc.data();
              let members = 0;

              const usersQuerySnapshot = await getDocs(usersCollectionRef);
              if (!usersQuerySnapshot.empty) {
                members = usersQuerySnapshot.size;
              }

              if (teamId !== selectedTeam) {
                teams.push({
                  id: teamId,
                  ...teamData,
                  members,
                  user: userData,
                });
              }
              teamsAdded++;
            }
          }

          // Update the state with the new data
          setData(teams);
          setError(null);
          setLoadingSearch(false);
          // Calculate the total number of pages based on the total number of retrospectives for the organization
          const totalQuery = query(
            teamsCollection,
            orderBy('searchableName', 'asc'),
            where('searchableName', '>=', search),
            where('searchableName', '<=', search + '\uf8ff'),
          );

          const totalTeams = await getDocs(totalQuery);
          setTotalTeams(totalTeams.size);
        } catch (error: any) {
          console.error('Error fetching teams:', error);
          setData([]);
          setError(error);
          setLoadingSearch(false);
        } finally {
          setLoadingSearch(false);
        }
      }
    },
    [userId, selectedTeam, fetchData, firestore, organizationId],
  );

  const fetchOrganizationTeams = useCallback(
    async () => {
      try {
        const teamsCollection = collection(
          firestore,
          ORGANIZATIONS_COLLECTION,
          organizationId,
          TEAMS_COLLECTION,
        );


        const querySnapshot = await getDocs(teamsCollection);
        return querySnapshot.size;

      } catch (error: any) {
        console.error('Error fetching teams:', error);
        setData([]);
        setError(error);
      } finally {
        setLoading(false);
      }
    },
    [firestore, organizationId],
  );

  useEffect(() => {
    if (userId && organizationId) {
      if (text !== '') search(1, text);
      else if (sorted != '') sortData(1, sorted, '');
      else fetchData(1);
    }
  }, [organizationId, pageSize, userId, text, selectedTeam]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    currentPage,
    totalPages,
    totalTeams,
    sortData,
    search,
    dropdownSearch,
    loadingSearch,
    fetchOrganizationTeams
  };
}
