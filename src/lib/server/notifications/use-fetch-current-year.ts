import {
    collection,
    CollectionReference,
    where,
    query,
    limit,
    startAfter,
    getDocs,
    onSnapshot,
    orderBy,
} from 'firebase/firestore';
import { useFirestore } from 'reactfire';
import {
    startOfYear,
    endOfMonth,
    subMonths,
} from 'date-fns';
import {
    NOTIFICATIONS_COLLECTION,
    ORGANIZATIONS_COLLECTION,
} from '~/lib/firestore-collections';
import { MembershipInvite } from '~/lib/organizations/types/membership-invite';
import { useCallback, useEffect, useState } from 'react';
import { InvitesListProps } from '~/lib/teams/types/teams';

import { onListenerError } from '~/lib/firestore-listener-error';

export function useFetchCurrentYearNotifications(
    organizationId: string,
    pageSize: number,
    userEmail: string,
) {
    const firestore = useFirestore();

    const collectionRef = collection(
        firestore,
        ORGANIZATIONS_COLLECTION,
        organizationId,
        NOTIFICATIONS_COLLECTION,
    ) as CollectionReference<WithId<MembershipInvite>>;

    const [data, setData] = useState<WithId<MembershipInvite> | any>();
    const [totalInvitations, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(0);
    const [error, setError] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (organizationId) {
            fetchData(1);
        }
    }, [pageSize, organizationId]);

    const fetchData = useCallback(
        async (page: number) => {
            try {
                setLoading(true);

                const startOfLastYear = startOfYear(new Date());
                const endOfPreviousMonth = endOfMonth(subMonths(new Date(), 2));

                const startAtIndex = (page - 1) * pageSize;

                let q = query(
                    collectionRef,
                    orderBy('created', 'desc'),
                    where('email', '==', userEmail),
                    where('created', '>=', startOfLastYear),
                    where('created', '<=', endOfPreviousMonth),
                );

                if (startAtIndex > 0) {
                    const querySnapshot = await getDocs(q);
                    const lastNotification = querySnapshot.docs[startAtIndex - 1];
                    q = query(q, startAfter(lastNotification));
                }

                q = query(q, limit(pageSize));

                const unsubscribe = onSnapshot(q, (snapshot) => {
                    const notificationData: InvitesListProps[] = [];
                    snapshot.forEach((doc) => {
                        notificationData.push({
                            ...doc.data(),
                        } as any);
                    });

                    setData(notificationData);
                    setError(null);

                    const totalQuery = query(
                        collectionRef,
                        orderBy('created', 'desc'),
                        where('email', '==', userEmail),
                        where('created', '>=', startOfLastYear),
                        where('created', '<=', endOfPreviousMonth),
                    );
                    getDocs(totalQuery).then((totalNotifications) => {
                        const totalPages = Math.ceil(totalNotifications.size / pageSize);
                        setTotal(totalNotifications.size);
                        setTotalPages(totalPages);
                    });
                },
                  onListenerError('use-fetch-current-year', {
                    setError,
                    setLoading,
                  }),
                );

                setCurrentPage(page);

                return () => unsubscribe();
            } catch (error: any) {
                console.error('Error fetching notifications:', error);
                setData([]);
                setError(error);
            } finally {
                setLoading(false);
            }
        },
        [pageSize, collectionRef, userEmail],
    );

    return {
        data,
        refetch: fetchData,
        totalInvitations,
        loading,
        error,
        currentPage,
        totalPages,
    };
}
