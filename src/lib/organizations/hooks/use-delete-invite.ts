import { useFirestore } from 'reactfire';
import {
  query,
  where,
  getDocs,
  collection,
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { useCallback } from 'react';

import {
  INVITES_COLLECTION,
  NOTIFICATIONS_COLLECTION,
  ORGANIZATIONS_COLLECTION,
} from '~/lib/firestore-collections';

export function useDeleteInvite() {
  const firestore = useFirestore();

  return useCallback(
    async (organizationId: string, inviteId: string) => {
      const invitesCollection = collection(
        firestore,
        ORGANIZATIONS_COLLECTION,
        organizationId,
        INVITES_COLLECTION,
      );
      const notificationsCollection = collection(
        firestore,
        ORGANIZATIONS_COLLECTION,
        organizationId,
        NOTIFICATIONS_COLLECTION,
      );

      const q = query(invitesCollection, where('code', '==', inviteId));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        deleteDoc(doc.ref);
      });

      const notificationsQ = query(
        notificationsCollection,
        where('code', '==', inviteId),
      );
      const notificationSnapshot = await getDocs(notificationsQ);
      notificationSnapshot.forEach((doc) => {
        deleteDoc(doc.ref);
      });
    },
    [firestore],
  );
}
