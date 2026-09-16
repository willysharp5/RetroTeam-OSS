import {
    collection,
    CollectionReference,
    where,
    query,
    onSnapshot,
    orderBy,
} from 'firebase/firestore';
import { useFirestore } from 'reactfire';
import { useState, useEffect, useCallback } from 'react';

import { Notification } from '~/lib/notifications/types/types';

/**
 * @description Hook to fetch documentation
 */
export function useFetchDocs(
) {
    const firestore = useFirestore();

    const [data, setData] = useState<any | null>(null);

    const [error, setError] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        fetchData();
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const collectionRef = collection(
                firestore,
                'docs'
            ) as CollectionReference<Notification>;

            setLoading(true);

            // Initialize the query
            let q = query(
                collectionRef,
                orderBy('order')
            );

            // Listen for real-time updates
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const data = snapshot.docs.map(doc => ({ ...doc.data() }));
                setData(data);
                setError(null);
            });

            // Cleanup function to unsubscribe from real-time updates
            return () => unsubscribe();
        } catch (error: any) {
            console.error('Error fetching teams:', error);
            setError(error);
        } finally {
            setLoading(false);
        }
    }, [firestore]);

    return { refetch: fetchData, data, loading, error };
}
