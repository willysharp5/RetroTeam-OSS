import { useState } from 'react';
import { useFirestore } from 'reactfire';
import { doc, deleteDoc } from 'firebase/firestore';
import { CUSTOM_TEMPLATES_COLLECTION } from '~/lib/firestore-collections';

export function useDeleteCustomTemplate(organization: string, teamId: string) {
  const firestore = useFirestore();
  const customTemplatesCollectionPath = `organizations/${organization}/teams/${teamId}/${CUSTOM_TEMPLATES_COLLECTION}`;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any | null>(null);

  const deleteTemplate = async (templateId: string) => {
    const templateRef = doc(
      firestore,
      customTemplatesCollectionPath,
      templateId,
    );

    try {
      setLoading(true);
      await deleteDoc(templateRef);
      setLoading(false);
    } catch (error) {
      console.error('Error deleting document:', error);
      setError(error);
      setLoading(false);
    }
  };

  return { loading, error, deleteTemplate };
}
