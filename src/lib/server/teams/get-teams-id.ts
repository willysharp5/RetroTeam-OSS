import { useCallback, useEffect, useState } from 'react';
import { useFirestore } from 'reactfire';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
  orderBy,
  startAfter,
  onSnapshot,
} from 'firebase/firestore';
import { TeamMembers } from '~/lib/teams/types/teams';
import { ORGANIZATIONS_COLLECTION, TEAMS_COLLECTION } from '~/lib/firestore-collections';

import { onListenerError } from '~/lib/firestore-listener-error';

function useFetchTeamsById(
  organizationId: string,
  teamId: any,
  pageSize: number,
  searchableText: string,
) {
  const firestore = useFirestore();

  const organizationCollectionPath = `organizations`;
  const organizationCollectionRef = collection(firestore, organizationCollectionPath);

  const teamsCollectionPath = `organizations/${organizationId}/teams`;
  const teamsCollectionRef = collection(firestore, teamsCollectionPath);

  const membersCollectionPath = `organizations/${organizationId}/teams/${teamId}/users`;
  const membersCollectionRef = collection(firestore, membersCollectionPath);

  const usersCollectionRef = collection(firestore, 'users');

  const [members, setMembers] = useState<TeamMembers[]>([]);

  const [loading, setLoading] = useState(true);

  const [teamData, setTeamData] = useState<any | null>(null);
  const [data, setData] = useState<any | null>(null);

  const [error, setError] = useState<any | null>(null);

  const [totalMembers, setTotalMembers] = useState(0);
  const [admins, setAdmins] = useState(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);


  const getUserData = async (userRef: any) => {
    const userDocSnapshot = await getDoc(userRef);
    if (userDocSnapshot.exists()) {
      const userData = userDocSnapshot.data() as any;
      return userData
    }
    return null;
  };

  const getUserTotalTeams = useCallback(
    async (userId: string) => {
      try {
        const teamsCollection = collection(
          firestore,
          ORGANIZATIONS_COLLECTION,
          organizationId,
          TEAMS_COLLECTION,
        );

        const userPath = `members.${userId}`;

        let q = query(
          teamsCollection,
          orderBy(userPath), // Order by the field with the inequality filter
          where(userPath, '!=', null),
        );

        const querySnapshot = await getDocs(q);

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

  const getOrganizationData = async (organizationId: any) => {
    const organizationRef = doc(organizationCollectionRef, organizationId);
    const organizationSnapshot = await getDoc(organizationRef);

    if (organizationSnapshot.exists()) {
      const organizationData = organizationSnapshot.data() as any;
      return organizationData
    }
    return null;
  };

  const fetchData = useCallback(
    async (page: number) => {
      try {
        setLoading(true);

        // GET TEAM DATA IN REAL-TIME
        const teamRef = doc(teamsCollectionRef, teamId);
        const teamUnsubscribe = onSnapshot(teamRef, async (teamSnapshot) => {
          if (!teamSnapshot.exists()) {
            console.error("Team not found");
            setError("Team not found");
            setLoading(false);
            return;
          }

          const teamData = teamSnapshot.data();
          setTeamData(teamData);

          // Calculate the startAt value based on the page number and page size
          const startAtIndex = (page - 1) * pageSize;

          // Initialize the query, ordered by userId
          let q = query(membersCollectionRef, orderBy('userId'));

          // If not the first page, use startAfter to paginate
          if (startAtIndex > 0) {
            const querySnapshot = await getDocs(q);
            const lastTeam = querySnapshot.docs[startAtIndex - 1];
            q = query(
              membersCollectionRef,
              orderBy('userId'),
              startAfter(lastTeam),
            );
          } else {
            q = query(membersCollectionRef, orderBy('userId'));
          }

          // Limit the results to the specified pageSize
          q = query(q, limit(pageSize));

          const membersUnsubscribe = onSnapshot(q, async (usersQuerySnapshot) => {
            const userData = [] as any;
            userData.length = 0;

            // GET ORGANIZATION DATA IN REAL-TIME
            const organizationData = await getOrganizationData(organizationId);

            if (!usersQuerySnapshot.empty) {

              const userDocs = [...usersQuerySnapshot.docs];

              for (const userDoc of userDocs) {
                const user = userDoc.data();

                const userInfo = await getUserData(user.user);

                const userTeams = await getUserTotalTeams(user.userId);
                
                if (userInfo && organizationData?.members[user.userId]) {
                  userInfo.role = organizationData?.members[user.userId]?.role;
                  userInfo.active = user.active;
                  userInfo.userId = user.userId;
                  userInfo.teams = userTeams;
                  userData.push(userInfo);
                }
              }

              setMembers(userData);

              const totalQuery = query(membersCollectionRef);
              const totalMembers = await getDocs(totalQuery);
              const totalPages = Math.ceil(totalMembers.size / pageSize);
              setTotalMembers(totalMembers.size);
              setTotalPages(totalPages);

              const totalAdmins = query(membersCollectionRef, where("role", ">", 0));
              const totalAdminMembers = await getDocs(totalAdmins);
              setAdmins(totalAdminMembers.size);

              setData({
                id: teamId,
                ...teamData,
                members: userData,
                users: userData,
                admins: totalAdminMembers.size,
              });


            }
          },
            onListenerError('get-teams-id', { setError, setLoading }),
          );

          setCurrentPage(page);
          return () => membersUnsubscribe();
        },
          onListenerError('get-teams-id', { setError, setLoading }),
        );

        return () => {
          teamUnsubscribe();

        };
      } catch (error: any) {
        console.error("Error fetching teams:", error);
        setData([]);
        setError(error);
      } finally {
        setLoading(false);
      }
    },
    [
      teamId,
      teamsCollectionRef,
      membersCollectionRef,
      pageSize,
      organizationId,
      getUserTotalTeams,
      getOrganizationData
    ]
  );

  const sortData = useCallback(
    async (page: number, type: string) => {
      try {
        // setLoading(true);

        // GET TEAM MEMBERS DATA

        const organizationRef = doc(organizationCollectionRef, organizationId);
        const organizationSnapshot = await getDoc(organizationRef);

        if (organizationSnapshot.exists()) {

          const organizationData = organizationSnapshot.data();

          // Calculate the startAt value based on the page number and page size
          const startAtIndex = (page - 1) * pageSize;

          // Initialize the query, ordered by userId
          let q = query(membersCollectionRef, orderBy('userId'));

          // If not the first page, use startAfter to paginate
          if (startAtIndex > 0) {
            const querySnapshot = await getDocs(q);
            const lastTeam = querySnapshot.docs[startAtIndex - 1];
            q = query(
              membersCollectionRef,
              orderBy('userId'),
              startAfter(lastTeam),
            );
          } else {
            q = query(membersCollectionRef, orderBy('userId'), limit(pageSize));
          }

          // Limit the results to the specified pageSize
          q = query(q, limit(pageSize));

          const userData = [] as any;

          const usersQuerySnapshot = await getDocs(q);

          if (!usersQuerySnapshot.empty) {
            const userDocs = [...usersQuerySnapshot.docs];

            //Get user data from users collection
            for (const userDoc of userDocs) {
              const user = userDoc.data();
              const userInfo = await getUserData(user.user);
              const userTeams = await getUserTotalTeams(user.userId)
              if (userInfo) {
                userInfo.role = organizationData?.members[user.userId]?.role;
                userInfo.active = user.active;
                userInfo.userId = user.userId;
                userInfo.teams = userTeams
                userData.push(userInfo);
              }
            }
          }

          //Sort user data
          if (type === 'ascending') {
            userData.sort((a: any, b: any) => {
              const nameA = a.name.toUpperCase();
              const nameB = b.name.toUpperCase();

              if (nameA < nameB) {
                return -1;
              }
              if (nameA > nameB) {
                return 1;
              }
              return 0;
            });
          } else {
            userData.sort((a: any, b: any) => {
              const nameA = a.name.toUpperCase();
              const nameB = b.name.toUpperCase();

              if (nameA < nameB) {
                return 1;
              }
              if (nameA > nameB) {
                return -1;
              }
              return 0;
            });
          }

          // Update the state with the new data
          setMembers(userData);
          setError(null);

          // Calculate the total number of pages based on the total number of members for the team
          const totalQuery = query(membersCollectionRef);
          const totalMembers = await getDocs(totalQuery);
          const totalPages = Math.ceil(totalMembers.size / pageSize);
          setTotalMembers(totalMembers.size);
          setTotalPages(totalPages);

          const team = {
            id: teamId,
            ...teamData,
            members,
            users: userData,
            admins,
          };

          setData(team);

          setCurrentPage(page);

        }


      } catch (error: any) {
        console.error('Error fetching teams:', error);
        setData([]);
        setError(error);
      } finally {
        setLoading(false);
      }
    },
    [teamId, membersCollectionRef, pageSize, admins, members, teamData, organizationCollectionRef, organizationId, getUserTotalTeams],
  );

  const search = useCallback(
    async (page: number, searchableText: string) => {

      const organizationRef = doc(organizationCollectionRef, organizationId);
      const organizationSnapshot = await getDoc(organizationRef);

      if (organizationSnapshot.exists()) {

        const organizationData = organizationSnapshot.data();

        if (searchableText !== '') {
          try {
            const search = searchableText?.replace(/\s+/g, '').toLowerCase();

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
              // Fetch all team members for the found user IDs

              // Calculate the startAt value based on the page number and page size
              const startAtIndex = (page - 1) * pageSize;
              // Initialize the query, ordered by userId
              let q = query(
                membersCollectionRef,
                orderBy('userId'),
                where('userId', 'in', userIds),
              );

              // If not the first page, use startAfter to paginate
              if (startAtIndex > 0) {
                const querySnapshot = await getDocs(q);
                const lastMember = querySnapshot.docs[startAtIndex - 1];
                q = query(q, startAfter(lastMember));
              }

              // Limit the results to the specified pageSize
              q = query(q, limit(pageSize));

              const userData = [] as any;

              const usersQuerySnapshot = await getDocs(q);

              if (!usersQuerySnapshot.empty) {
                const userDocs = [...usersQuerySnapshot.docs];

                //Get user data from users collection
                for (const userDoc of userDocs) {
                  const user = userDoc.data();
                  const userInfo = await getUserData(user.user);
                  const userTeams = await getUserTotalTeams(user.userId)
                  if (userInfo) {
                    userInfo.role = organizationData?.members[user.userId]?.role;
                    userInfo.active = user.active;
                    userInfo.userId = user.userId;
                    userInfo.teams = userTeams
                    userData.push(userInfo);
                  }
                }
              }
              const usersData = await Promise.all(userData);

              // Update the state with the new data
              setMembers(userData);

              if (usersData.length > 0) {
                const team = {
                  id: teamId,
                  ...teamData,
                  members,
                  users: userData,
                  admins,
                };
                setData(team);

                // Calculate the total number of pages based on the total number of members for the team
                const totalQuery = query(
                  membersCollectionRef,
                  where('userId', 'in', userIds),
                );
                const totalMembers = await getDocs(totalQuery);
                const totalPages = Math.ceil(totalMembers.size / pageSize);
                setTotalPages(totalPages);
                setCurrentPage(page);
              } else {
                console.error('No members found for this page');
              }
            } else {
              setData([]);
              console.error('Username not found');
              setLoading(false);
            }

            setLoading(false);
          } catch (error) {
            console.error('Error fetching team members:', error);
            setError(error);
            setLoading(false);
          }
        }
      }


    },
    [
      teamId,
      membersCollectionRef,
      pageSize,
      admins,
      members,
      teamData,
      usersCollectionRef,
      organizationCollectionRef,
      organizationId,
      getUserTotalTeams
    ],
  );

  useEffect(() => {
    if (organizationId && teamId) {
      if (searchableText === '') fetchData(1);
      else search(1, searchableText);
    }
  }, [organizationId, teamId, pageSize]);



  return {
    loading,
    data,
    error,
    refetch: fetchData,
    search,
    totalMembers,
    currentPage,
    totalPages,
    sortData,
  };
}

export default useFetchTeamsById;
