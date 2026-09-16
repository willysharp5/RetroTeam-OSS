import {
  collection,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  where,
} from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { useFirestore } from 'reactfire';
import { ORGANIZATIONS_COLLECTION, USERS_COLLECTION } from '~/lib/firestore-collections';
import { MembershipRole } from '~/lib/organizations/types/membership-role';

export default function useFetchOrganizationMembers(
  organizationId: string,
  pageSize: number,
  sorted: boolean,
) {
  const firestore = useFirestore();

  const membersCollectionPath = `${ORGANIZATIONS_COLLECTION}/${organizationId}/${USERS_COLLECTION}`;
  const membersCollectionRef = collection(firestore, membersCollectionPath);

  const [members, setMembers] = useState<any[]>([]);
  const [admins, setAdmins] = useState(0);
  const [allAdmins, setAllAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);

  const [totalMembers, setTotalMembers] = useState(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);

  const fetchData = useCallback(
    (page: number) => {
      let unsubscribe: (() => void) | null = null;
  
      try {
        setLoading(true);
        const startAtIndex = (page - 1) * pageSize;
  
        let q = query(membersCollectionRef, orderBy('userId'));
  
        
        const handleSnapshot = async (snapshot: any) => {
          const userData: any[] = [];
  
          if (!snapshot.empty) {
            const userDocs = [...snapshot.docs];
  
            for (const userDoc of userDocs) {
              const user = userDoc.data();
              const userInfo = await getUserData(user.user);
              if (userInfo) {
                userInfo.role = user.role;
                userInfo.userId = user.userId;
                userData.push(userInfo);
              }
            }
          }
  
          if (sorted) {
            userData.sort((a: any, b: any) => {
              const nameA = a.name.toUpperCase();
              const nameB = b.name.toUpperCase();
  
              return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
            });
          } else {
            userData.sort((a: any, b: any) => {
              const nameA = a.name.toUpperCase();
              const nameB = b.name.toUpperCase();
  
              return nameA < nameB ? 1 : nameA > nameB ? -1 : 0;
            });
          }
  
          setMembers(userData);
          setError(null);
  
          const totalQuery = query(membersCollectionRef);
          const totalMembersSnapshot = await getDocs(totalQuery);
          const totalPages = Math.ceil(totalMembersSnapshot.size / pageSize);
          setTotalMembers(totalMembersSnapshot.size);
          setTotalPages(totalPages);
  
          const totalAdmins = query(membersCollectionRef, where('role', '>', 0));
          const totalAdminMembersSnapshot = await getDocs(totalAdmins);
          setAdmins(totalAdminMembersSnapshot.size);
  
          setCurrentPage(page);
        };

        if (startAtIndex > 0) {
          getDocs(q).then((querySnapshot) => {
            const lastTeam = querySnapshot.docs[startAtIndex - 1];
            q = query(
              membersCollectionRef,
              orderBy('userId'),
              startAfter(lastTeam),
              limit(pageSize)
            );
  
            unsubscribe = onSnapshot(q, handleSnapshot);
          });
        } else {
          q = query(q, limit(pageSize));
          unsubscribe = onSnapshot(q, handleSnapshot);
        }
  
      } catch (error: any) {
        console.error('Error fetching members:', error);
        setMembers([]);
        setError(error);
      } finally {
        setLoading(false);
      }
  
      return () => {
        if (unsubscribe) unsubscribe();
      };
    },
    [membersCollectionRef, pageSize, sorted]
  );
  const fetchAdminsData = useCallback(() => {
    setLoading(true);

    // Define the query to get only admin members
    const q = query(membersCollectionRef, where('role', '==', MembershipRole.Admin));

    // Set up the real-time listener
    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const userData = [] as any;

        if (!snapshot.empty) {
          const userDocs = [...snapshot.docs];

          // Fetch user data from the users collection
          for (const userDoc of userDocs) {
            const user = userDoc.data();
            const userInfo = await getUserData(user.user);
            if (userInfo) {
              userInfo.role = user.role;
              userInfo.userId = user.userId;
              if (user.role === 1) {
                userData.push(userInfo);
              }
            }
          }
        }

        // Update the state with the fetched data
        setAllAdmins(userData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching members:', error);
        setAllAdmins([]);
        setError(error);
        setLoading(false);
      }
    );

    // Cleanup function to unsubscribe from the snapshot listener when component unmounts
    return () => unsubscribe();
  }, [membersCollectionRef]);


  useEffect(() => {
    if (organizationId) {
      fetchData(1);
      const unsubscribe = fetchAdminsData();
      return unsubscribe;
    }
  }, [organizationId, pageSize, sorted]);

  const getUserData = async (userRef: any) => {
    const userDocSnapshot = await getDoc(userRef);
    if (userDocSnapshot.exists()) {
      return userDocSnapshot.data() as any;
    }
    return null;
  };

  return {
    loading,
    error,
    refetch: fetchData,
    totalMembers,
    currentPage,
    members,
    totalPages,
    admins,
    allAdmins
  };
}
