import { collection, query, where, onSnapshot } from 'firebase/firestore';

import { useCallback, useState, useEffect } from 'react';
import { useFirestore } from 'reactfire';

import {
  ORGANIZATIONS_COLLECTION,
  USERS_COLLECTION,
} from '~/lib/firestore-collections';

/**
 * @name useGetAdminStats
 * @description Live counts of users and organizations for the admin dashboard,
 * both as a total for the selected range and broken down by month.
 *
 * This build has no paid tier, so there is nothing to count as "paying" or
 * "free" — every install is simply the people and organizations using it.
 */
export function useGetAdminStats(dateRange: {
  startDate: string | null;
  endDate: string | null;
}) {
  const firestore = useFirestore();

  const organizationCollection = collection(firestore, ORGANIZATIONS_COLLECTION);
  const usersCollection = collection(firestore, USERS_COLLECTION);

  const [customers, setCustomers] = useState<any>([]);
  const [organizations, setOrganizations] = useState<any>([]);

  const [totalcustomers, setTotalCustomers] = useState(0);
  const [totalorganizations, setTotalOrganizations] = useState(0);

  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingOrganizations, setLoadingOrganizations] = useState(false);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCustomers = useCallback(
    (startDate: Date, endDate: Date) => {
      setLoadingCustomers(true);
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();
      const chartData: { name: any; [key: string]: number }[] = [];
      const unsubscribeList = [] as any;

      const getDataForMonth = (year: number, month: number) => {
        return new Promise<{ month: string; count: number }>(
          (resolve, reject) => {
            const startMonth = new Date(year, month - 1, 1);
            const endMonth = new Date(year, month, 0, 23, 59, 59);

            const startMonthDate = Math.floor(startMonth.getTime());
            const endMonthDate = Math.floor(endMonth.getTime());

            const q = query(
              usersCollection,
              where('createdAt', '>=', startMonthDate),
              where('createdAt', '<=', endMonthDate),
            );

            const unsubscribe = onSnapshot(
              q,
              (querySnapshot) => {
                const count = querySnapshot.size;
                const monthName = startMonth.toLocaleString('default', {
                  month: 'long',
                });

                resolve({ month: monthName, count });
              },
              (error) => {
                console.error('Error fetching users:', error);
                setError(error);
                setLoadingCustomers(false);
                reject(error);
              },
            );

            unsubscribeList.push(unsubscribe);
          },
        );
      };

      const fetchYearData = async (year: number) => {
        const yearData: { name: any; [key: string]: number } = {
          name: year.toString(),
        } as any;

        const tempData: { [key: string]: number } = {};

        for (let month = 1; month <= 12; month++) {
          const { month: monthName, count } = await getDataForMonth(
            year,
            month,
          );
          tempData[monthName] = count;
        }

        // Reorder yearData based on MONTH_ORDER
        for (const monthName of MONTH_ORDER) {
          if (tempData[monthName] !== undefined) {
            yearData[monthName] = tempData[monthName];
          }
        }

        chartData.push(yearData);
        chartData.sort((a, b) => parseInt(a.name) - parseInt(b.name));
        setCustomers([...chartData]);
      };

      const fetchAllData = async () => {
        for (let year = startYear; year <= endYear; year++) {
          await fetchYearData(year);
        }
        setLoadingCustomers(false);
      };
      fetchAllData();

      // TOTAL DATA
      const getTotalCustomers = () => {
        return new Promise<{}>((resolve, reject) => {
          const startDateF = new Date(startDate);
          startDateF.setHours(0, 0, 0, 0);

          const endDateF = new Date(endDate);
          endDateF.setHours(23, 59, 59, 999);

          const startDateTime = Math.floor(startDateF.getTime());
          const endDateTime = Math.floor(endDateF.getTime());

          const q = query(
            usersCollection,
            where('createdAt', '>=', startDateTime),
            where('createdAt', '<=', endDateTime),
          );

          const unsubscribe = onSnapshot(
            q,
            (querySnapshot) => {
              const count = querySnapshot.size;
              setTotalCustomers(count);
              resolve({});
            },
            (error) => {
              console.error('Error fetching users:', error);
              setError(error);
              setLoadingCustomers(false);
              reject(error);
            },
          );

          unsubscribeList.push(unsubscribe);
        });
      };
      getTotalCustomers();

      return () => {
        unsubscribeList.forEach((unsubscribe: any) => unsubscribe());
      };
    },
    [usersCollection],
  );

  const fetchOrganizations = useCallback(
    (startDate: Date, endDate: Date) => {
      setLoadingOrganizations(true);
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();
      const chartData: { name: any; [key: string]: number }[] = [];
      const unsubscribeList = [] as any;

      const getDataForMonth = (year: number, month: number) => {
        return new Promise<{ month: string; count: number }>(
          (resolve, reject) => {
            const startMonth = new Date(year, month - 1, 1);
            const endMonth = new Date(year, month, 0, 23, 59, 59);

            const startMonthDate = Math.floor(startMonth.getTime());
            const endMonthDate = Math.floor(endMonth.getTime());

            const q = query(
              organizationCollection,
              where('createdAt', '>=', startMonthDate),
              where('createdAt', '<=', endMonthDate),
            );

            const unsubscribe = onSnapshot(
              q,
              (querySnapshot) => {
                const count = querySnapshot.size;

                const monthName = startMonth.toLocaleString('default', {
                  month: 'long',
                });

                resolve({ month: monthName, count });
              },
              (error) => {
                console.error('Error fetching organizations:', error);
                setError(error);
                setLoadingOrganizations(false);
                reject(error);
              },
            );

            unsubscribeList.push(unsubscribe);
          },
        );
      };

      const fetchYearData = async (year: number) => {
        const yearData: { name: any; [key: string]: number } = {
          name: year.toString(),
        } as any;

        const tempData: { [key: string]: number } = {};

        for (let month = 1; month <= 12; month++) {
          const { month: monthName, count } = await getDataForMonth(
            year,
            month,
          );
          tempData[monthName] = count;
        }

        // Reorder yearData based on MONTH_ORDER
        for (const monthName of MONTH_ORDER) {
          if (tempData[monthName] !== undefined) {
            yearData[monthName] = tempData[monthName];
          }
        }

        chartData.push(yearData);
        chartData.sort((a, b) => parseInt(a.name) - parseInt(b.name));
        setOrganizations([...chartData]);
      };

      const fetchAllData = async () => {
        for (let year = startYear; year <= endYear; year++) {
          await fetchYearData(year);
        }
        setLoadingOrganizations(false);
      };

      fetchAllData();

      // TOTAL DATA
      const getTotalOrganizations = () => {
        return new Promise<{}>((resolve, reject) => {
          const startDateF = new Date(startDate);
          startDateF.setHours(0, 0, 0, 0);

          const endDateF = new Date(endDate);
          endDateF.setHours(23, 59, 59, 999);

          const startDateTime = Math.floor(startDateF.getTime());
          const endDateTime = Math.floor(endDateF.getTime());

          const q = query(
            organizationCollection,
            where('createdAt', '>=', startDateTime),
            where('createdAt', '<=', endDateTime),
          );

          const unsubscribe = onSnapshot(
            q,
            (querySnapshot) => {
              const count = querySnapshot.size;
              setTotalOrganizations(count);
              resolve({});
            },
            (error) => {
              console.error('Error fetching organizations:', error);
              setError(error);
              setLoadingOrganizations(false);
              reject(error);
            },
          );

          unsubscribeList.push(unsubscribe);
        });
      };
      getTotalOrganizations();

      return () => {
        unsubscribeList.forEach((unsubscribe: any) => unsubscribe());
      };
    },
    [organizationCollection],
  );

  useEffect(() => {
    if (dateRange.startDate !== null && dateRange.endDate != null) {
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);

      startDate.setDate(startDate.getDate() + 1);
      endDate.setDate(endDate.getDate() + 1);

      fetchCustomers(startDate, endDate);
      fetchOrganizations(startDate, endDate);
    } else {
      const startDate = new Date();
      const endDate = new Date();

      fetchCustomers(startDate, endDate);
      fetchOrganizations(startDate, endDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  useEffect(() => {
    setLoading(loadingCustomers || loadingOrganizations);
  }, [loadingCustomers, loadingOrganizations]);

  return {
    loading,
    error,
    customers,
    organizations,
    totalcustomers,
    totalorganizations,
  };
}

const MONTH_ORDER = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
