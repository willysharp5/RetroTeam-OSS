import {
  collection,
  getDoc,
  doc,
  deleteDoc, // Importing deleteDoc for deleting documents
} from 'firebase/firestore';
import { useCallback, useState, useEffect } from 'react';
import { useFirestore } from 'reactfire';
import { ORGANIZATIONS_COLLECTION } from '~/lib/firestore-collections';
import { RETROSPECTIVES_COLLECTION } from '~/lib/firestore-collections';

export function useDeleteRetrospective(organizationId: string) {
  const firestore = useFirestore();
  const retrospectivesCollectionPath = `${ORGANIZATIONS_COLLECTION}/${organizationId}/${RETROSPECTIVES_COLLECTION}`;
  const retrospectivesCollection = collection(
    firestore,
    retrospectivesCollectionPath,
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteRetrospective = useCallback(
    async (retrospectiveId: string) => {
      try {
        setLoading(true);

        const retrospectiveRef = doc(retrospectivesCollection, retrospectiveId);
        await deleteDoc(retrospectiveRef); // Delete the retrospective document

        setError(null);
      } catch (error: any) {
        console.error('Error deleting retrospective:', error);
        setError(error);
      } finally {
        setLoading(false);
      }
    },
    [retrospectivesCollection],
  );

  return {
    loading,
    error,
    deleteRetrospective,
  };
}
