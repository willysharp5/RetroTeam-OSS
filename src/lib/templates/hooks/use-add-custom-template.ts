import { collection, addDoc, doc } from 'firebase/firestore';
import { useFirestore } from 'reactfire';
import { CUSTOM_TEMPLATES_COLLECTION } from '~/lib/firestore-collections';
import { ORGANIZATIONS_COLLECTION } from '~/lib/firestore-collections';
import { TEAMS_COLLECTION } from '~/lib/firestore-collections';
import { useCallback } from 'react';
import { Structure } from '~/lib/structures/types/structures';

interface TemplateData {
  title: string;
  summary?: string;
  structure: Structure[];
}

export function useAddCustomTemplate() {
  const firestore = useFirestore();

  return useCallback(
    async (
      templateData: TemplateData,
      organizationID: string,
      teamId: string,
    ) => {
      try {
        const teamDocRef = doc(
          firestore,
          ORGANIZATIONS_COLLECTION,
          organizationID,
          TEAMS_COLLECTION,
          teamId,
        );
        const templatesCollection = collection(
          teamDocRef,
          CUSTOM_TEMPLATES_COLLECTION,
        );
        const addedDocRef = await addDoc(templatesCollection, templateData);
        return addedDocRef.id;
      } catch (error) {
        console.error('Error saving custom template:', error);
        return null;
      }
    },
    [firestore],
  );
}
