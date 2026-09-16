import { useFirestore } from 'reactfire';
import { collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useCallback } from 'react';

import {
  ORGANIZATIONS_COLLECTION,
  RETROSPECTIVES_COLLECTION,
} from '~/lib/firestore-collections';

export function useAddAIToRetrospective() {
  const firestore = useFirestore();

  return useCallback(
    async (
      organizationId: string,
      retrospectiveId: string,
      type: string,
      value: any,
    ) => {
      const retrospectiveCollection = collection(
        firestore,
        ORGANIZATIONS_COLLECTION,
        organizationId,
        RETROSPECTIVES_COLLECTION,
      );
      const retrospectiveRef = doc(retrospectiveCollection, retrospectiveId);
      const retrospectiveSnapshot = await getDoc(retrospectiveRef);

      try {
        const ref = doc(firestore, ORGANIZATIONS_COLLECTION, organizationId);
        const docSnap = await getDoc(ref);

        if (docSnap.exists()) {
          const currentAiCounter = docSnap.data().aiCounter || 0;
          const newAiCounter = currentAiCounter + 1;

          await updateDoc(ref, {
            aiCounter: newAiCounter,
          });
        } else {
          console.log("Organization document don't exists");
        }
      } catch (e) {
        console.error(e);
      }

      if (retrospectiveSnapshot.exists()) {
        if (type === 'ai-insights') {
          const updatedData = {
            aiInsigths: value,
          };
          await updateDoc(retrospectiveRef, updatedData);
        }
      } else {
        console.log('Retrospective document does not exist.');
      }
    },
    [firestore],
  );
}
