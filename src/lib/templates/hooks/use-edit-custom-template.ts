import { useState } from 'react';
import { useFirestore } from 'reactfire';
import { doc, updateDoc } from 'firebase/firestore';

import { CUSTOM_TEMPLATES_COLLECTION } from '~/lib/firestore-collections';

export function useEditCustomTemplate(organization: string, teamId: string) {
  const firestore = useFirestore();
  const customTemplatesCollectionPath = `organizations/${organization}/teams/${teamId}/${CUSTOM_TEMPLATES_COLLECTION}`;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any | null>(null);

  const editTemplate = async (templateId: string, updatedData: any) => {
    const templateRef = doc(
      firestore,
      customTemplatesCollectionPath,
      templateId,
    );

    try {
      setLoading(true);
      await updateDoc(templateRef, updatedData);
      setLoading(false);
    } catch (error) {
      console.error('Error editing document:', error);
      setError(error);
      setLoading(false);
    }
  };

  return { loading, error, editTemplate };
}
