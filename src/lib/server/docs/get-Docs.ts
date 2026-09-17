import { collection, getDocs } from 'firebase/firestore';
import { useFirestore } from 'reactfire';
import { useState, useEffect, useCallback } from 'react';

import {
  DEFAULT_DOCS,
  DocsLink,
  readDocsDocuments,
} from '~/lib/server/docs/default-docs';

const DOCS_COLLECTION = 'docs';

/**
 * @description Hook to fetch the help links shown in the app header.
 *
 * Starts from the built-in links in `DEFAULT_DOCS` and replaces them only if the
 * optional `docs` collection has usable documents, so the header renders on a
 * fresh install where that collection does not exist. A failure here is
 * reported and otherwise ignored: help links are not worth taking a screen
 * down for.
 *
 * This reads once instead of listening. The links change when a self-hoster
 * edits them by hand, which is not something the header has to react to live,
 * and a listener that is denied stays denied for the life of the page.
 */
export function useFetchDocs() {
  const firestore = useFirestore();

  const [data, setData] = useState<DocsLink[]>(DEFAULT_DOCS);
  const [error, setError] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const querySnapshot = await getDocs(
        collection(firestore, DOCS_COLLECTION),
      );

      const seededDocs = readDocsDocuments(
        querySnapshot.docs.map((doc) => doc.data() as Partial<DocsLink>),
      );

      // an empty collection is the normal case, and means "use the built-ins"
      if (seededDocs.length) {
        setData(seededDocs);
      }

      setError(null);
    } catch (error: any) {
      console.error('Error fetching docs:', error);

      // the built-in links are already in state, so the header still works
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [firestore]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { refetch: fetchData, data, loading, error };
}
