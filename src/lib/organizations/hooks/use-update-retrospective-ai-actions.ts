import { FirebaseError } from 'firebase/app';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useFirestore } from 'reactfire';
import { useCallback } from 'react';

import { useRequestState } from '~/core/hooks/use-request-state';
import { Organization } from '~/lib/organizations/types/organization';
import {
  ORGANIZATIONS_COLLECTION,
  RETROSPECTIVES_COLLECTION,
} from '~/lib/firestore-collections';

/**
 * @name useUpdateRetrospectiveAIActions
 * @description Hook to update a retrospective's ai actions response
 */
export function useUpdateRetrospectiveAIActions() {
  const { state, setError, setData, setLoading } =
    useRequestState<Partial<WithId<Organization>>>();

  const firestore = useFirestore();

  const updateRetrospective = useCallback(
    async (organizationId: string, retrospectiveId: string, aiBody: any) => {
      if (!organizationId || !retrospectiveId || aiBody === undefined) {
        setError('Invalid input data');
        return;
      }

      setLoading(true);
      try {
        const ref = doc(firestore, ORGANIZATIONS_COLLECTION, organizationId);
        const retrospectiveRef = doc(
          firestore,
          ORGANIZATIONS_COLLECTION,
          organizationId,
          RETROSPECTIVES_COLLECTION,
          retrospectiveId,
        );
        const docSnap = await getDoc(ref);
        const retrospectiveDocSnap = await getDoc(retrospectiveRef);

        if (retrospectiveDocSnap.exists()) {
          await updateDoc(retrospectiveRef, {
            aiActions: aiBody,
          });

          // Update Ai Counter
          if (docSnap.exists()) {
            const currentAiCounter = docSnap.data().aiCounter || 0;
            const newAiCounter = currentAiCounter + 1;

            await updateDoc(ref, {
              aiCounter: newAiCounter,
            });
          } else {
            console.log("Organization document doesn't exist");
          }
        } else {
          setError("Retrospective document doesn't exist");
        }
      } catch (e) {
        setError((e as FirebaseError).message);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [firestore, setError, setLoading],
  );

  return [updateRetrospective, state] as [
    typeof updateRetrospective,
    typeof state,
  ];
}
