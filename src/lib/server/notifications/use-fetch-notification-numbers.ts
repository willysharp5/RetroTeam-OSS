import {
  collection,
  CollectionReference,
  where,
  query,
  onSnapshot,
} from 'firebase/firestore';
import { useFirestore } from 'reactfire';
import { useState, useEffect, useCallback } from 'react';

import {
  NOTIFICATIONS_COLLECTION,
  ORGANIZATIONS_COLLECTION,
} from '~/lib/firestore-collections';
import { Notification } from '~/lib/notifications/types/types';

/**
 * @description Hook to fetch today notifications
 * @param organizationId
 * @param pageSize
 * @param userEmail
 */
export function useFetchNotificationNumbers(
  organizationId: string,
  userEmail: string,
) {
  const firestore = useFirestore();

  const [totalNotifications, setTotal] = useState(0);

  const [error, setError] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (organizationId && userEmail) {
      fetchData();
    }
  }, [organizationId, userEmail]);

  const fetchData = useCallback(async () => {
    try {
      const collectionRef = collection(
        firestore,
        ORGANIZATIONS_COLLECTION,
        organizationId,
        NOTIFICATIONS_COLLECTION,
      ) as CollectionReference<Notification>;

      setLoading(true);

      // Initialize the query
      let q = query(
        collectionRef,
        where('email', '==', userEmail),
        where('seen', '==', false),
      );

      // Listen for real-time updates
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setTotal(snapshot.size);
        setError(null);
      });

      // Cleanup function to unsubscribe from real-time updates
      return () => unsubscribe();
    } catch (error: any) {
      console.error('Error fetching teams:', error);
      setTotal(0);
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [userEmail, firestore, organizationId]);

  return { refetch: fetchData, totalNotifications, loading, error };
}
