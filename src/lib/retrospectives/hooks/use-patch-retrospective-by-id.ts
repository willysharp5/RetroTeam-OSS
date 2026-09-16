import { collection, getDoc, doc, updateDoc } from 'firebase/firestore';
import { useCallback, useState, useEffect } from 'react';
import { useFirestore } from 'reactfire';
import { ORGANIZATIONS_COLLECTION } from '~/lib/firestore-collections';
import { TEAMS_COLLECTION } from '~/lib/firestore-collections';
import { RETROSPECTIVES_COLLECTION } from '~/lib/firestore-collections';
import { Retrospectives } from '../types/retrospectives';

export function usePatchRetrospective(organizationId: string) {
  const firestore = useFirestore();
  const retrospectivesCollectionPath = `${ORGANIZATIONS_COLLECTION}/${organizationId}/${RETROSPECTIVES_COLLECTION}`;
  const retrospectivesCollection = collection(
    firestore,
    retrospectivesCollectionPath,
  );
  const [retrospective, setRetrospective] = useState<Retrospectives | any>();
  const [boardMembers, setMembers] = useState();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const patchRetrospective = useCallback(
    async (data: Partial<Retrospectives>) => {
      try {
        setLoading(true);

        const retrospectiveRef = doc(retrospectivesCollection, data.id);
        await updateDoc(retrospectiveRef, data);

        const updatedRetrospectiveSnapshot = await getDoc(retrospectiveRef);
        if (updatedRetrospectiveSnapshot.exists()) {
          const updatedRetrospectiveData = updatedRetrospectiveSnapshot.data();
          setRetrospective(updatedRetrospectiveData);
        }

        setError(null);
      } catch (error: any) {
        console.error('Error patching retrospective:', error);
        setError(error);
      } finally {
        setLoading(false);
      }
    },
    [retrospectivesCollection],
  );

  return {
    retrospective,
    loading,
    error,
    patchRetrospective,
    members: boardMembers,
  };
}
