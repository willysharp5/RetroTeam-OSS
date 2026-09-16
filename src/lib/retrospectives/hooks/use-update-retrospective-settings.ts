import { useFirestore } from 'reactfire';
import { collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useCallback } from 'react';

import {
  ORGANIZATIONS_COLLECTION,
  RETROSPECTIVES_COLLECTION,
} from '~/lib/firestore-collections';

export function useUpdateRetrospectiveSettings() {
  const firestore = useFirestore();

  return useCallback(
    async (
      organizationId: string,
      retrospectiveId: string,
      type: string,
      value: any,
      name: string,
    ) => {
      const retrospectiveCollection = collection(
        firestore,
        ORGANIZATIONS_COLLECTION,
        organizationId,
        RETROSPECTIVES_COLLECTION,
      );
      const retrospectiveRef = doc(retrospectiveCollection, retrospectiveId);
      const retrospectiveSnapshot = await getDoc(retrospectiveRef);

      if (!retrospectiveSnapshot.exists()) {
        console.log('Retrospective document does not exist.');
        return;
      }

      const searchableName = name.replace(/\s+/g, '').toLowerCase();

      const updateData = {
        lock: { locked: value, name, searchableName },
        access: { access: { type: value }, name, searchableName },
        name: { name, searchableName },
        ai: { groupWithAI: value, name, searchableName },
        'ai-actions': { actionsWithAI: value, name, searchableName },
        selectedColumns: { selectedColumns: value },
        allowMembersViewComments: { allowMembersViewComments: value },
        loadingAIGrouping: { loadingAIGrouping: value }
      } as any;

      const dataToUpdate = updateData[type];

      if (dataToUpdate) {
        await updateDoc(retrospectiveRef, dataToUpdate);
      }
    },
    [firestore],
  );
}
