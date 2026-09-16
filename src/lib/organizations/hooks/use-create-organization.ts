import { useCallback } from 'react';
import { useUser } from 'reactfire';

import { FirebaseError } from 'firebase/app';

import {
  getFirestore,
  collection,
  doc,
  writeBatch,
  DocumentReference,
} from 'firebase/firestore';

import { useRequestState } from '~/core/hooks/use-request-state';
import { MembershipRole } from '~/lib/organizations/types/membership-role';
import { OrganizationModal } from '~/lib/organizations/types/organization';
import { UserData } from '~/core/session/types/user-data';

import {
  ORGANIZATIONS_COLLECTION,
  USERS_COLLECTION,
} from '~/lib/firestore-collections';

/**
 * @name useCreateOrganization
 * @description Hook to create a new organization
 */

export function useCreateOrganization() {
  const user = useUser();
  const userId = user.data?.uid as string;

  const { state, setError, setData, setLoading } =
    useRequestState<WithId<OrganizationModal>>();

  const createOrganizationCallback = useCallback(
    async (name: string) => {
      const firestore = getFirestore();
      const batch = writeBatch(firestore);

      try {
        setLoading(true);

        const organizations = collection(firestore, ORGANIZATIONS_COLLECTION);

        const userDoc = doc(
          firestore,
          USERS_COLLECTION,
          userId,
        ) as DocumentReference<UserData>;

        const organizationDoc = doc(organizations);
        const searchableName = name.replace(' ', '').toLowerCase();
        const organizationData = {
          name,
          searchableName,
          members: {
            [userDoc.id]: {
              role: MembershipRole.Admin,
              user: userDoc,
            },
          },
          subscription: null,
          invites: 0,
          aiCounter: 0,
          createdAt: new Date().getTime(),
        };

        batch.set(organizationDoc, organizationData);

        await batch.commit();

        setData({
          name,
          searchableName: searchableName,
          id: organizationDoc.id,
          members: {
            [userDoc.id]: {
              role: MembershipRole.Admin,
              user: userDoc,
            },
          },
          invites: 0,
          aiCounter: 0,
          subscription: null,
          createdAt: new Date().getTime(),
        });

        return organizationDoc.id;
      } catch (e) {
        setError((e as FirebaseError).message);

        throw e;
      }
    },
    [setData, setError, setLoading, userId],
  );

  return [createOrganizationCallback, state] as [
    typeof createOrganizationCallback,
    typeof state,
  ];
}
