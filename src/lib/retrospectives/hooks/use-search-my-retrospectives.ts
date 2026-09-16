import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    doc,
} from 'firebase/firestore';
import { useCallback, useState, useEffect } from 'react';
import { useFirestore } from 'reactfire';
import {
    ACTIONS_COLLECTION,
    BOARD_COLLECTION,
    ORGANIZATIONS_COLLECTION,
    TEAMS_COLLECTION,
} from '~/lib/firestore-collections';
import { RETROSPECTIVES_COLLECTION } from '~/lib/firestore-collections';
import { Retrospectives } from '../types/retrospectives';


export function useSearchMyRetrospectives(
    organizationId: string,
    userId: string,
    teamId: string,
    text: string
) {
    const firestore = useFirestore();
    const retrospectivesCollectionPath = `${ORGANIZATIONS_COLLECTION}/${organizationId}/${RETROSPECTIVES_COLLECTION}`;
    const retrospectivesCollection = collection(
        firestore,
        retrospectivesCollectionPath,
    );
    
    const teamCollectionPath = `${ORGANIZATIONS_COLLECTION}/${organizationId}/${TEAMS_COLLECTION}/${teamId}`;
    const teamRef = doc(firestore, teamCollectionPath);
    
    const [loading, setLoading] = useState<boolean>(true);

    const [myRetrospectives, setMyRetrospectives] = useState<Retrospectives[]>(
        [],
    );

    const [error, setError] = useState<Error | null>(null);

    const [loadingSearch, setLoadingSearch] = useState(false);

    const fetchAllMyRetrospectives = useCallback(
        async () => {
            try {
                setLoading(true);
                // Initialize the query with organizationId, ordered by date in descending order
                let q = query(
                    retrospectivesCollection,
                    where('organization', '==', organizationId),
                    where('team', '==', teamRef)
                );

                // Add a where filter for archived equals false or where archived doesn't exist
                q = query(q, where('archived', '==', false), limit(4));

                // Order by date after order by archived
                q = query(q, orderBy('date', 'desc'));

                // Execute the query to get the documents
                const querySnapshot = await getDocs(q);

                // Use map to handle async operations and wait for all promises to resolve
                const retrospectiveData = await Promise.all(querySnapshot.docs.map(async (doc) => {
                    const data = doc.data();
                    const actionsCollectionPath = `${ORGANIZATIONS_COLLECTION}/${organizationId}/${BOARD_COLLECTION}/${doc.id}/${ACTIONS_COLLECTION}`;
                    const actionsCollection = collection(
                        firestore,
                        actionsCollectionPath,
                    );

                    const actionsQuerySnapshot = await getDocs(actionsCollection);
                    data.actionsCount = actionsQuerySnapshot.size;

                    // Check if the user is a member and active
                    if (data.members[userId]?.active) {
                        return data;
                    }

                    return null;
                }));

                // Filter out null values (for items that did not meet the condition)
                const filteredRetrospectiveData = retrospectiveData.filter(item => item !== null) as any;

                // Set the retrospectives state with the filtered data
                setMyRetrospectives(filteredRetrospectiveData);
                setError(null);
            } catch (error: any) {
                console.error('Error fetching retrospectives:', error);
                setMyRetrospectives([]);
                setError(error);
            } finally {
                setLoading(false);
            }
        },
        [organizationId, userId, retrospectivesCollection, firestore, teamRef],
    );

    const searchAllMyRetrospectivesByName = useCallback(
        async (text: string) => {
            setLoadingSearch(true);
            try {
                const search = text?.replace(/\s+/g, '').toLowerCase();
                let q = query(
                    retrospectivesCollection,
                    where('archived', '==', false),
                    where('team', '==', teamRef),
                    orderBy('searchableName', 'asc'),
                    where('searchableName', '>=', search),
                    where('searchableName', '<=', search + '\uf8ff'),
                );

                const querySnapshot = await getDocs(q);
                // Use map to handle async operations and wait for all promises to resolve
                const retrospectiveData = await Promise.all(querySnapshot.docs.map(async (doc) => {
                    const data = doc.data();
                    const actionsCollectionPath = `${ORGANIZATIONS_COLLECTION}/${organizationId}/${BOARD_COLLECTION}/${doc.id}/${ACTIONS_COLLECTION}`;
                    const actionsCollection = collection(
                        firestore,
                        actionsCollectionPath,
                    );

                    const actionsQuerySnapshot = await getDocs(actionsCollection);
                    data.actionsCount = actionsQuerySnapshot.size;

                    // Check if the user is a member and active
                    if (data.members[userId]?.active) {
                        return data;
                    }

                    return null;
                }));

                // Filter out null values (for items that did not meet the condition)
                const filteredRetrospectiveData = retrospectiveData.filter(item => item !== null) as any;

                setMyRetrospectives(filteredRetrospectiveData);

                setError(null);
                // Calculate the total number of pages based on the total number of retrospectives for the organization
            } catch (error: any) {
                console.error('Error fetching teams:', error);
                setMyRetrospectives([]);
                setError(error);
                setLoadingSearch(false);
            } finally {
                setLoadingSearch(false);
            }
        }, [organizationId, userId, retrospectivesCollection, firestore, teamRef],
    )

    useEffect(() => {
        dropdownSearch(text);
    }, [organizationId, userId, text]);

    const dropdownSearch = useCallback(
        async (text: string) => {
            if (text === '') {
                fetchAllMyRetrospectives();
            } else {
                searchAllMyRetrospectivesByName(text)
            }
        },
        [fetchAllMyRetrospectives, searchAllMyRetrospectivesByName],
    );


    return {
        loading,
        loadingSearch,
        error,
        dropdownSearch,
        myRetrospectives,
    };
}
