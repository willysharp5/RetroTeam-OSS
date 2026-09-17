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
} from 'firebase/firestore';
import { useCallback, useState, useEffect } from 'react';
import { useFirestore } from 'reactfire';

import {
  ORGANIZATIONS_COLLECTION,
  RETROSPECTIVES_COLLECTION,
  TEAMS_COLLECTION,
  USERS_COLLECTION,
} from '~/lib/firestore-collections';
import { Organization } from '~/lib/organizations/types/organization';
import { Teams } from '~/lib/teams/types/teams';

import { onListenerError } from '~/lib/firestore-listener-error';

export function useFetchUserById(
  userId: string,
  organizations: any[],
  organizationPageSize: number,
  teamPageSize: number,
  retrospectivesPageSize: number,
) {
  const firestore = useFirestore();

  const [data, setData] = useState<any>(null);

  const [organization, setOrganization] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [retrospectives, setRetrospectives] = useState<any[]>([]);

  const [totalOrganizations, setTotalOrganizations] = useState(0);
  const [totalTeams, setTotalTeams] = useState(0);
  const [totalRetrospectives, setTotalRetrospectives] = useState(0);

  const [totalOrganizationsPages, setTotalOrganizationsPages] = useState(0);
  const [totalTeamsPages, setTotalTeamsPages] = useState(0);
  const [totalRetrospectivesPages, setTotalRetrospectivesPages] = useState(0);

  const [currentOrganizationPage, setCurrentOrganizationPage] =
    useState<number>(1);
  const [currentTeamPage, setCurrentTeamPage] = useState<number>(1);
  const [currentRetrospectivePage, setCurrentRetrospectivesPage] =
    useState<number>(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const userDocRef = doc(collection(firestore, USERS_COLLECTION), userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        setData(userDoc.data());

        const teams = [];
        const retrospectives = [];

        for (let i = 0; i < organizations.length; i++) {
          const organizationData = organizations[i];

          const teamsCollection = collection(
            firestore,
            ORGANIZATIONS_COLLECTION,
            organizationData.id,
            TEAMS_COLLECTION,
          );
          const retrospectivesCollection = collection(
            firestore,
            ORGANIZATIONS_COLLECTION,
            organizationData.id,
            RETROSPECTIVES_COLLECTION,
          );

          const path = `members.${userId}`;

          let teamsQ = query(teamsCollection, where(path, '!=', null));

          let retrospectivesQ = query(
            retrospectivesCollection,
            where(path, '!=', null),
          );

          const teamsQuerySnapshot = await getDocs(teamsQ);

          for (const teamsDoc of teamsQuerySnapshot.docs) {
            const teamsData = teamsDoc.data();
            teamsData.organizationId = organizationData.id;
            teamsData.organizationName = organizationData.name;
            teams.push(teamsData);
          }

          const retrospectivesQuerySnapshot = await getDocs(retrospectivesQ);

          for (const retrospectivesDoc of retrospectivesQuerySnapshot.docs) {
            const retrospectiveData = retrospectivesDoc.data();
            retrospectiveData.organizationId = organizationData.id;
            retrospectiveData.organizationName = organizationData.name;
            retrospectives.push(retrospectiveData);
          }
        }
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
  }, [firestore, userId, organizations]);

  const fetchUserOrganization = useCallback(
    async (page: number) => {
      try {
        setLoading(true);
        setError(null);

        const organizationCollectionRef = collection(
          firestore,
          ORGANIZATIONS_COLLECTION,
        );

        // Calculate the startAt value based on the page number and page size
        const startAtIndex = (page - 1) * organizationPageSize;

        // Initialize the query, ordered by userId
        let q = query(
          organizationCollectionRef,
          where(`members.${userId}`, '!=', null),
        );

        // If not the first page, use startAfter to paginate
        if (startAtIndex > 0) {
          const querySnapshot = await getDocs(q);
          const lastOrganization = querySnapshot.docs[startAtIndex - 1];
          q = query(q, startAfter(lastOrganization));
        }

        // Limit the results to the specified pageSize
        q = query(q, limit(organizationPageSize));

        // Listen for real-time updates
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const organizationData: Organization[] = [];
          snapshot.forEach((doc) => {
            organizationData.push({
              ...doc.data(),
              id: doc.id,
              role: doc.data().members[userId].role,
            } as any);
          });
          setOrganization(organizationData);
          setError(null);

          // Calculate the total number of pages based on the total number of members for the team
          const totalQuery = query(
            organizationCollectionRef,
            where(`members.${userId}`, '!=', null),
          );
          getDocs(totalQuery).then((totalMembers) => {
            const totalPages = Math.ceil(
              totalMembers.size / organizationPageSize,
            );
            setTotalOrganizations(totalMembers.size);
            setTotalOrganizationsPages(totalPages);
          });
        },
          onListenerError('use-fetch-user', { setError, setLoading }),
        );

        setCurrentOrganizationPage(page);

        // Cleanup function to unsubscribe from real-time updates
        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching organizations user:', error);
        setData(null);
        setError(error);
      } finally {
        setLoading(false);
      }
    },
    [firestore, userId, organizationPageSize],
  );

  const fetchAllTeams = useCallback(
    async (organizations: any) => {
      try {
        const allTeams: Teams[] = [];

        for (let i = 0; i < organizations.length; i++) {
          const teamsCollectionRef = collection(
            firestore,
            ORGANIZATIONS_COLLECTION,
            organizations[i].id,
            TEAMS_COLLECTION,
          );
          const q = query(
            teamsCollectionRef,
            where(`members.${userId}`, '!=', null),
          );
          const snapshot = await getDocs(q);
          snapshot.forEach((doc) => {
            allTeams.push({
              ...doc.data(),
              id: doc.id,
              role: doc.data().members[userId].role,
              organizationName: organizations[i].name,
            } as any);
          });
        }

        return allTeams;
      } catch (error) {
        console.error('Error fetching teams:', error);
        throw error;
      }
    },
    [firestore, userId],
  );

  const fetchUserTeam = useCallback(
    async (page: number) => {
      const fetchAndPaginateTeams = async () => {
        try {
          setLoading(true);
          setError(null);

          // Fetch all teams from all organizations
          const allTeams = await fetchAllTeams(organizations);

          // Paginate the combined results

          const startAtIndex = (page - 1) * teamPageSize;
          const paginatedTeams = allTeams.slice(
            startAtIndex,
            startAtIndex + teamPageSize,
          );

          setTeams(paginatedTeams);
          setTotalTeams(allTeams.length);
          setTotalTeamsPages(Math.ceil(allTeams.length / teamPageSize));

          setCurrentTeamPage(page);
        } catch (error) {
          console.error('Error fetching and paginating teams:', error);
          setTeams([]);
          setError(error);
        } finally {
          setLoading(false);
        }
      };
      if (userId && organizations.length > 0) {
        fetchAndPaginateTeams();
      }
    },
    [userId, organizations, teamPageSize, fetchAllTeams],
  );

  const fetchAllRetrospectives = useCallback(async () => {
    try {
      const allRetrospectives: any[] = []; // Define la interfaz de retrospectives según sea necesario

      for (const organization of organizations) {
        const retrospectivesCollectionRef = collection(
          firestore,
          ORGANIZATIONS_COLLECTION,
          organization.id,
          RETROSPECTIVES_COLLECTION,
        );
        const retrospectivesSnapshot = await getDocs(
          query(
            retrospectivesCollectionRef,
            where(`members.${userId}`, '!=', null),
          ),
        );

        retrospectivesSnapshot.forEach((doc) => {
          allRetrospectives.push({
            ...doc.data(),
            id: doc.id,
            role: doc.data().members[userId].role,
            organizationName: organization.name,
          } as any);
        });
      }

      return allRetrospectives;
    } catch (error) {
      console.error('Error fetching retrospectives:', error);
      throw error;
    }
  }, [firestore, userId, organizations]);

  const fetchUserRetrospectives = useCallback(
    async (page: number) => {
      const fetchAndPaginateRetrospectives = async () => {
        try {
          setLoading(true);
          setError(null);

          // Fetch all retrospectives from all teams within all organizations
          const allRetrospectives = await fetchAllRetrospectives();
          
          // Paginate the combined results
          const startAtIndex = (page - 1) * retrospectivesPageSize;
          const paginatedRetrospectives = allRetrospectives.slice(
            startAtIndex,
            startAtIndex + retrospectivesPageSize,
          );

          setRetrospectives(paginatedRetrospectives);
          setTotalRetrospectives(allRetrospectives.length);
          setTotalRetrospectivesPages(
            Math.ceil(allRetrospectives.length / retrospectivesPageSize),
          );

          setCurrentRetrospectivesPage(page);
        } catch (error) {
          console.error('Error fetching and paginating retrospectives:', error);
          setRetrospectives([]);
          setError(error);
        } finally {
          setLoading(false);
        }
      };

      if (userId && organizations.length > 0) {
        fetchAndPaginateRetrospectives();
      }
    },
    [userId, organizations, retrospectivesPageSize, fetchAllRetrospectives],
  );

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchUserOrganization(1);
    }
  }, [userId, organizationPageSize]);

  useEffect(() => {
    if (userId && organizations.length > 0) {
      fetchUserTeam(1);
    }
  }, [userId, organizations, teamPageSize]);

  useEffect(() => {
    if (userId && organizations.length > 0) {
      fetchUserRetrospectives(1);
    }
  }, [userId, organizations, retrospectivesPageSize]);

  return {
    data,
    organization,
    totalOrganizationsPages,
    totalOrganizations,
    currentOrganizationPage,
    fetchUserOrganization,
    teams,
    totalTeamsPages,
    totalTeams,
    currentTeamPage,
    fetchUserTeam,
    retrospectives,
    totalRetrospectivesPages,
    totalRetrospectives,
    currentRetrospectivePage,
    fetchUserRetrospectives,
    loading,
    error,
    refetch: fetchData,
  };
}
