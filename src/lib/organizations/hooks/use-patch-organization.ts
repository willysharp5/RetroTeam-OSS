import { collection, getDoc, doc, updateDoc } from 'firebase/firestore';
import { useCallback, useState, useEffect } from 'react';
import { useFirestore } from 'reactfire';
import { ORGANIZATIONS_COLLECTION } from '~/lib/firestore-collections';

import { Organization } from '../types/organization';

export function usePatchOrganization(organizationId: string) {
    const firestore = useFirestore();
    const organizationsCollectionPath = `${ORGANIZATIONS_COLLECTION}`;
    const organizationCollection = collection(
        firestore,
        organizationsCollectionPath,
    );

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    const patchOrganization = useCallback(
        async (data: Partial<Organization>) => {
            try {
                setLoading(true);

                const organizationRef = doc(organizationCollection, organizationId);
                await updateDoc(organizationRef, data);



                setError(null);
            } catch (error: any) {
                console.error('Error patching organization:', error);
                setError(error);
            } finally {
                setLoading(false);
            }
        },
        [organizationCollection, organizationId],
    );

    return {
        loading,
        error,
        patchOrganization,
    };
}
