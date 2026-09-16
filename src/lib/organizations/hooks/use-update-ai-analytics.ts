import { FirebaseError } from 'firebase/app';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useFirestore } from 'reactfire';
import { useCallback } from 'react';

import { useRequestState } from '~/core/hooks/use-request-state';
import { Organization } from '~/lib/organizations/types/organization';
import { ORGANIZATIONS_COLLECTION } from '~/lib/firestore-collections';

/**
 * @name useUpdateOrganization
 * @description Hook to update an organization's ai analytics response
 */
export function useUpdateOrganizationAIAnalytics() {
  const { state, setError, setData, setLoading } =
    useRequestState<Partial<WithId<Organization>>>();

  const firestore = useFirestore();

  const updateOrganization = useCallback(
    async (
      organizationId: string,
      aiBody: any,
      analyzedRetrospectives: any,
    ) => {
      if (organizationId) {
        setLoading(true);
        try {
          const ref = doc(firestore, ORGANIZATIONS_COLLECTION, organizationId);
          const docSnap = await getDoc(ref);

          if (docSnap.exists()) {
            const currentAiCounter = docSnap.data().aiCounter || 0;
            const newAiCounter = currentAiCounter + 1;

            await updateDoc(ref, {
              aiAnalytics: aiBody,
              aiCounter: newAiCounter,
              aiAnalyzedRetrospectives: analyzedRetrospectives,
            });
          } else {
            console.log("Organization document don't exists");
          }
        } catch (e) {
          setError((e as FirebaseError).message);

          throw e;
        }
      }
    },
    [firestore, setError, setLoading],
  );

  return [updateOrganization, state] as [
    typeof updateOrganization,
    typeof state,
  ];
}
