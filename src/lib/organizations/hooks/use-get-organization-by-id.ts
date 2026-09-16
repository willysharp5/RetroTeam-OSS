import { collection, doc, getDocs, onSnapshot, query, where } from 'firebase/firestore';

import { useCallback, useState, useEffect } from 'react';
import { useFirestore } from 'reactfire';

import { ORGANIZATIONS_COLLECTION } from '~/lib/firestore-collections';
import { Organization } from '../types/organization';

export function useGetOrganizationById(organizationId: string) {
  const firestore = useFirestore();

  const organizationPath = `${ORGANIZATIONS_COLLECTION}`;
  const organizationCollection = collection(firestore, organizationPath);

  const [organization, setOrganization] = useState<Organization | any>();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null | any>(null);

  const fetchOrganization = useCallback(async () => {
    try {
      setLoading(true);
      const organizationRef = doc(organizationCollection, organizationId);

      // Set up a real-time listener for the organization Collection
      const unsubscribeData = onSnapshot(
        organizationRef,
        async (querySnapshot) => {
          const organizationData = querySnapshot.data();

          if (organizationData) {
            organizationData.id = organizationId
            setOrganization(organizationData);
          }
        },
      );

      // Clean up listeners when no longer needed
      return () => {
        unsubscribeData();
      };
    } catch (error: any) {
      console.error('Error fetching organizations:', error);
      setOrganization(null);
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [organizationCollection, organizationId]);

  const fetchOrganizationByDomain = useCallback(
    async (companyEmail: string) => {
      if (!companyEmail) return null;
  
      try {
        
  console.log("companyEmail", companyEmail)
        const organizationQuery = query(
          organizationCollection,
          where("companyEmail", "==", companyEmail)
        );
  
        const querySnapshot = await getDocs(organizationQuery);
  
        if (!querySnapshot.empty) {
          const docSnapshot = querySnapshot.docs[0];
          const organizationData = {
            id: docSnapshot.id,
            ...docSnapshot.data()
          };
          return organizationData;
        } else {
          return null;
        }
      } catch (error: any) {
        console.error("Error fetching organizations:", error);
        setError(error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [organizationCollection]
  );  

  useEffect(() => {
    // Fetch board when the component mounts or when organizationId changes
    if (organizationId) {
      fetchOrganization();
    }
  }, [organizationId]);

  return {
    organization,
    loading,
    error,
    fetchOrganization,
    fetchOrganizationByDomain
  };
}
