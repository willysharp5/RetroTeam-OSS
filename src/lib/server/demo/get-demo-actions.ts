import { useEffect, useState } from 'react';
import { useFirestore } from 'reactfire';
import {
    collection,
    doc,
    onSnapshot,
    query,
    orderBy,
    getDoc,
} from 'firebase/firestore';
import { USERS_COLLECTION } from '~/lib/firestore-collections';

function useFetchDemoActions() {
    const firestore = useFirestore();

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any[] | null>(null);
    const [error, setError] = useState<any | null>(null);

    const fetchData = () => {
        try {
            const actionsCollectionPath = `demo/${'demo'}/actions`;
            const actionsCollectionRef = collection(firestore, actionsCollectionPath);
            const queryFilters = [];
            queryFilters.push(orderBy('order'));


            const actionsQuery = query(actionsCollectionRef, ...queryFilters);

            const unsubscribe = onSnapshot(
                actionsQuery,
                async (querySnapshot) => {
                    const userData = [];

                    for (const docSnapshot of querySnapshot.docs) {
                        const item = docSnapshot.data();
                        userData.push({ ...item });
                    }

                    setData(userData);
                    setLoading(false);
                },
                (error) => {
                    console.error('Error fetching documents:', error);
                    setError(error);
                    setLoading(false);
                }
            );

            // Cleanup the listener on component unmount
            return () => unsubscribe();
        }
        catch (e) {

        }
    }
    useEffect(() => {
        fetchData()
    }, []);

    return { loading, data, error, refetch: fetchData };
}

export default useFetchDemoActions;
