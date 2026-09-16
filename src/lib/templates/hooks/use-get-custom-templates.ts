import { useEffect, useState } from 'react';
import { useFirestore } from 'reactfire';
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
} from 'firebase/firestore';
import { ORGANIZATIONS_COLLECTION } from '~/lib/firestore-collections';
import { TEAMS_COLLECTION } from '~/lib/firestore-collections';
import { CUSTOM_TEMPLATES_COLLECTION } from '~/lib/firestore-collections';

interface LoadedPages {
  [key: number]: any[];
}

export function useGetCustomTemplates(
  organization: string,
  teamId: string,
  pageSize: number = 1,
) {
  const firestore = useFirestore();
  const customTemplatesCollectionPath = `${ORGANIZATIONS_COLLECTION}/${organization}/${TEAMS_COLLECTION}/${teamId}/${CUSTOM_TEMPLATES_COLLECTION}`;
  const customTemplatesCollectionRef = collection(
    firestore,
    customTemplatesCollectionPath,
  );

  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<any[] | null>(null);
  const [error, setError] = useState<any | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);

  const [loadedPages, setLoadedPages] = useState<LoadedPages>({});

  const [totalCustomTemplates, setTotalCustomTemplates] = useState<number>(0);

  const fetchData = async (page: number) => {
    let customTemplatesQuery = query(
      customTemplatesCollectionRef,
      orderBy('title'),
    );

    // Calculate the startAt value based on the page number and page size
    const startAtIndex = (page - 1) * pageSize;

    // If not the first page, use startAfter to paginate
    if (startAtIndex > 0) {
      const startAfterDoc =
        loadedPages[page - 1][loadedPages[page - 1].length - 1];
      customTemplatesQuery = query(
        customTemplatesQuery,
        startAfter(startAfterDoc.title),
      );
    }

    // Limit the results to the specified pageSize
    customTemplatesQuery = query(customTemplatesQuery, limit(pageSize));

    try {
      const querySnapshot = await getDocs(customTemplatesQuery);
      const customTemplates = [] as any[];

      for (const docSnapshot of querySnapshot.docs) {
        const item = {
          id: docSnapshot.id,
          ...docSnapshot.data(),
        };
        customTemplates.push(item);
      }
      setData(customTemplates);

      // Calculate the total number of pages based on the total number of retrospectives for the organization
      const totalQuery = query(customTemplatesCollectionRef);
      const totalCustomTemplates = await getDocs(totalQuery);
      const totalPages = Math.ceil(totalCustomTemplates.size / pageSize);
      setTotalPages(totalPages);
      setTotalCustomTemplates(totalCustomTemplates.size);

      setCurrentPage(page);
      setLoadedPages((prevState) => {
        return { ...prevState, [page]: customTemplates };
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError(error);
      setLoading(false);
    }
  };

  const refetch = (page: number) => {
    setLoading(true);
    fetchData(page);
  };

  useEffect(() => {
    fetchData(1);
  }, [organization, pageSize]);

  return {
    loading,
    data,
    error,
    refetch,
    currentPage,
    totalPages,
    totalCustomTemplates,
  };
}
