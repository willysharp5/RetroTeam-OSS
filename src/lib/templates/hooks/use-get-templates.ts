import {
  collection,
  getDocs,
  CollectionReference,
  QuerySnapshot,
  DocumentData,
  query,
  orderBy,
  startAfter,
  limit,
} from 'firebase/firestore';
import { useFirestore } from 'reactfire';
import { TEMPLATES_COLLECTION } from '~/lib/firestore-collections';
import { Templates } from '../types/templates';
import { useEffect, useState } from 'react';

interface LoadedPages {
  [key: number]: any[];
}

export function useGetTemplates(pageSize: number = 4) {
  const firestore = useFirestore();
  const templatesCollection: CollectionReference<DocumentData> = collection(
    firestore,
    TEMPLATES_COLLECTION,
  );

  const [templateData, setTemplateData] = useState<Templates[]>([]);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);

  const [loadedPages, setLoadedPages] = useState<LoadedPages>({});

  const [totalTemplates, setTotalTemplates] = useState<number>(0);

  async function fetchTemplates(page: number) {
    try {
      let templatesQuery = query(
        templatesCollection,
        orderBy('title'),
        limit(pageSize),
      );

      // Calculate the startAt value based on the page number and page size
      const startAtIndex = (page - 1) * pageSize;

      // If not the first page, use startAfter to paginate
      if (startAtIndex > 0) {
        const startAfterDoc =
          loadedPages[page - 1][loadedPages[page - 1].length - 1];
        templatesQuery = query(templatesQuery, startAfter(startAfterDoc.title));
      }

      const querySnapshot: QuerySnapshot<DocumentData> =
        await getDocs(templatesQuery);
      const templates: Templates[] = [];

      querySnapshot.forEach((doc) => {
        const data = { ...doc.data() };
        templates.push({
          id: doc.id,
          title: data.title,
          summary: data.summary,
          structure: data.structure,
        });
      });
      setTemplateData(templates);

      // Calculate the total number of pages based on the total number of retrospectives for the organization
      const totalQuery = query(templatesCollection);
      const totalCustomTemplates = await getDocs(totalQuery);
      const totalPages = Math.ceil(totalCustomTemplates.size / pageSize);
      setTotalPages(totalPages);
      setTotalTemplates(totalCustomTemplates.size);

      setCurrentPage(page);
      setLoadedPages((prevState) => {
        return { ...prevState, [page]: templates };
      });
    } catch (error) {
      console.error('Error al obtener las plantillas:', error);
      setTemplateData([]);
    }
  }

  useEffect(() => {
    fetchTemplates(1);
  }, [pageSize]);

  return {
    templateData,
    fetchTemplates,
    currentPage,
    totalPages,
    totalTemplates,
  };
}
