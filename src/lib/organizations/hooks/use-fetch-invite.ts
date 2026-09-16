import {
  collection,
  CollectionReference,
  where,
  query,
  getDocs,
} from 'firebase/firestore';
import { useFirestore } from 'reactfire';
import { useState, useEffect } from 'react';
import { MembershipInvite } from '~/lib/organizations/types/membership-invite';

import {
  INVITES_COLLECTION,
  ORGANIZATIONS_COLLECTION,
} from '~/lib/firestore-collections';

/**
 * @description Hook to fetch the organization's invited members where team.id = 1
 * @param organizationId
 */
export function useFetchInviteCode(organizationId: string, code: string) {
  const firestore = useFirestore();

  const collectionRef = collection(
    firestore,
    ORGANIZATIONS_COLLECTION,
    organizationId,
    INVITES_COLLECTION,
  ) as CollectionReference<WithId<MembershipInvite>>;

  const [data, setData] = useState<WithId<MembershipInvite> | any>();

  useEffect(() => {
    getInvites();
  }, []);

  async function getInvites() {
    const invitationQuery = query(collectionRef, where('code', '==', code));

    const querySnapshot = await getDocs(invitationQuery);

    const invites = [];

    for (const teamDoc of querySnapshot.docs) {
      invites.push(teamDoc.data());
    }
    console.log('invites', invites);
    setData(invites);
  }

  return { data };
}
