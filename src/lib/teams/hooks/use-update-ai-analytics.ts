import { FirebaseError } from 'firebase/app';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useFirestore } from 'reactfire';
import { useCallback } from 'react';

import { useRequestState } from '~/core/hooks/use-request-state';
import { Organization } from '~/lib/organizations/types/organization';
import { ORGANIZATIONS_COLLECTION, TEAMS_COLLECTION } from '~/lib/firestore-collections';

/**
 * @name useUpdateTeamAiAnalytics
 * @description Hook to update an teams's ai analytics response
 */
export function useUpdateTeamAiAnalytics() {
  const { state, setError, setData, setLoading } =
    useRequestState<Partial<WithId<Organization>>>();

  const firestore = useFirestore();

  const updateTeamAiAnalytics = useCallback(
    async (
      organizationId: string,
      teamId: string,
      aiBody: any,
      analyzedRetrospectives: any,
    ) => {
      if (organizationId) {
        setLoading(true);
        try {
          const ref = doc(firestore, ORGANIZATIONS_COLLECTION, organizationId, TEAMS_COLLECTION, teamId);
          const docSnap = await getDoc(ref);

          const organizationRef = doc(firestore, ORGANIZATIONS_COLLECTION, organizationId);
          const orgSnap = await getDoc(organizationRef);

          if (docSnap.exists()) {

            await updateDoc(ref, {
              aiAnalytics: aiBody,
              aiAnalyzedRetrospectives: analyzedRetrospectives,
            });

            if (orgSnap.exists()) {
              const currentAiCounter = orgSnap.data().aiCounter || 0;
              const newAiCounter = currentAiCounter + 1;

              await updateDoc(ref, {
                aiCounter: newAiCounter,
              });
            }
          } else {
            console.error("Organization document don't exists");
          }
        } catch (e) {
          setError((e as FirebaseError).message);

          throw e;
        }
      }
    },
    [firestore, setError, setLoading],
  );

  return [updateTeamAiAnalytics, state] as [
    typeof updateTeamAiAnalytics,
    typeof state,
  ];
}
