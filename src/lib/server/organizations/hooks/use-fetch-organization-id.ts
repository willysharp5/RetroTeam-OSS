import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  startAfter,
  where,
  orderBy,
} from 'firebase/firestore';
import { useCallback, useState, useEffect } from 'react';
import { useFirestore } from 'reactfire';

import {
  ORGANIZATIONS_COLLECTION,
  TEAMS_COLLECTION,
  USERS_COLLECTION,
} from '~/lib/firestore-collections';
import { Teams } from '~/lib/teams/types/teams';

export function useFetchOrganizationById(
  organizationId: string,
  teamPageSize: number,
  membersPageSize: number,
  searchTeamName: string,
  searchMemberId: string,
  sortTeam: any,
) {
  const firestore = useFirestore();

  const [data, setData] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);

  const [retrospectives, setRetrospectives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const [totalTeamPages, setTotalTeamPages] = useState(0);
  const [totalMembersPage, setTotalMembersPages] = useState(0);
  const [totalTeams, setTotalTeams] = useState(0);

  const [currentMembersPage, setCurrentMembersPage] = useState(1);
  const [currentTeamPage, setCurrentTeamPage] = useState(1);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const organiaztionDocRef = doc(
        collection(firestore, ORGANIZATIONS_COLLECTION),
        organizationId,
      );
      const organizationDoc = await getDoc(organiaztionDocRef);

      const teamsCollection = collection(
        firestore,
        ORGANIZATIONS_COLLECTION,
        organizationId,
        TEAMS_COLLECTION,
      );

      if (organizationDoc.exists()) {
        const querySnapshot = await getDocs(teamsCollection);
        const teams = [] as any;
        for (const teamDoc of querySnapshot.docs) {
          const teamData = teamDoc.data();
          teamData.id = teamDoc.id;
          teams.push(teamData);
        }
        const data = organizationDoc.data() as any;
        data.teams = teams;
        setData(data);
      } else {
        setData(null);
        setError(new Error('User not found'));
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setData(null);
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [firestore, organizationId]);

  const fetchMembersData = useCallback(
    async (page: number, sort: any, text: string) => {
      try {
        setLoading(true);
        setError(null);

        const organiaztionDocRef = doc(
          collection(firestore, ORGANIZATIONS_COLLECTION),
          organizationId,
        );
        const organizationDoc = await getDoc(organiaztionDocRef);

        const membersCollection = collection(
          firestore,
          ORGANIZATIONS_COLLECTION,
          organizationId,
          USERS_COLLECTION,
        );

        const startAtIndex = (page - 1) * membersPageSize;

        if (organizationDoc.exists()) {
          let q = query(membersCollection);

          if (text && text !== '') {
            q = query(
              q,
              where('userId', '>=', text),
              where('userId', '<=', text + '\uf8ff'),
              orderBy('userId', sort),
            );
          }

          if (startAtIndex > 0) {
            const querySnapshot = await getDocs(q);
            const lastTeam = querySnapshot.docs[startAtIndex - 1];
            q = query(q, startAfter(lastTeam));
          }

          q = query(q, limit(membersPageSize));

          const unsubscribe = onSnapshot(q, async (snapshot) => {
            const users = [] as any[];
            for (const doc of snapshot.docs) {
              const membersData = doc.data();
              membersData.id = doc.id;
              users.push(membersData);
            }
            setMembers(users);
            setError(null);

            let totalQuery = query(membersCollection);

            if (text && text !== '') {
              q = query(
                q,
                where('userId', '>=', text),
                where('userId', '<=', text + '\uf8ff'),
                orderBy('userId', sort),
              );
            }
            const totalUsersSnapshot = await getDocs(totalQuery);
            const totalPages = Math.ceil(
              totalUsersSnapshot.size / membersPageSize,
            );
            setTotalMembersPages(totalPages);
          });

          setCurrentMembersPage(page);

          return () => unsubscribe();
        } else {
          setMembers([]);
          setError(new Error('User not found'));
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setData(null);
        setError(error);
      } finally {
        setLoading(false);
      }
    },
    [firestore, organizationId, membersPageSize],
  );

  const fetchTeamData = useCallback(
    async (page: number) => {
      try {
        const teamsCollection = collection(
          firestore,
          ORGANIZATIONS_COLLECTION,
          organizationId,
          TEAMS_COLLECTION,
        );

        setLoading(true);
        // Calculate the startAt value based on the page number and page size
        const startAtIndex = (page - 1) * teamPageSize;

        // Initialize the query, ordered by created
        let q = query(teamsCollection, orderBy('searchableName', sortTeam));

        if (searchTeamName != '') {
          const search = searchTeamName.replace(/\s+/g, '').toLowerCase();

          q = query(
            q,
            where('searchableName', '>=', search),
            where('searchableName', '<=', search + '~'),
          );
        }

        // If not the first page, use startAfter to paginate
        if (startAtIndex > 0) {
          const querySnapshot = await getDocs(q);
          const lastTeam = querySnapshot.docs[startAtIndex - 1];
          q = query(q, startAfter(lastTeam));
        }
        // Limit the results to the specified pageSize
        q = query(q, limit(teamPageSize));

        // Listen for real-time updates
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const teamsData: Teams[] = [];
          snapshot.forEach((doc) => {
            teamsData.push({
              ...doc.data(),
            } as any);
          });

          setTeams(teamsData);
          setError(null);

          // Calculate the total number of pages based on the total number of members for the team

          let totalQ = query(
            teamsCollection,
            orderBy('searchableName', sortTeam),
          );
          if (searchTeamName != '') {
            const search = searchTeamName.replace(/\s+/g, '').toLowerCase();

            totalQ = query(
              totalQ,
              where('searchableName', '>=', search),
              where('searchableName', '<=', search + '~'),
            );
          }

          getDocs(totalQ).then((totalTeams) => {
            const totalPages = Math.ceil(totalTeams.size / teamPageSize);
            setTotalTeams(totalTeams.size);
            setTotalTeamPages(totalPages);
          });
        });

        setCurrentTeamPage(page);

        // Cleanup function to unsubscribe from real-time updates
        return () => unsubscribe();
      } catch (error: any) {
        console.error('Error fetching teams:', error);
        setData([]);
        setError(error);
      } finally {
        setLoading(false);
      }
    },
    [teamPageSize, searchTeamName, firestore, organizationId, sortTeam],
  );

  useEffect(() => {
    if (organizationId) {
      fetchData();
    }
  }, [organizationId, fetchData]);

  useEffect(() => {
    fetchTeamData(1);
  }, [teamPageSize, searchTeamName, sortTeam]);

  useEffect(() => {
    fetchMembersData(1, '', searchMemberId);
  }, [membersPageSize, searchMemberId]);

  return {
    data,
    teams,
    retrospectives,
    loading,
    error,
    refetch: fetchData,
    totalTeamPages,
    totalTeams,
    currentTeamPage,
    fetchTeamData,
    members,
    fetchMembersData,
    currentMembersPage,
    totalMembersPage,
  };
}
