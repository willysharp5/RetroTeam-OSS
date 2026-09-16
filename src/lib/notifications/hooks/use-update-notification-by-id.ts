import { useFirestore } from 'reactfire';
import { collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useCallback } from 'react';

import {
  NOTIFICATIONS_COLLECTION,
  ORGANIZATIONS_COLLECTION,
} from '~/lib/firestore-collections';

export function useUpdateNotificationById() {
  const firestore = useFirestore();

  return useCallback(
    async (organizationId: string, type: string, notificationId: string) => {
      const notificationsCollection = collection(
        firestore,
        ORGANIZATIONS_COLLECTION,
        organizationId,
        NOTIFICATIONS_COLLECTION,
      );

      const notificationRef = doc(notificationsCollection, notificationId);
      const notificationSnapshot = await getDoc(notificationRef);

      if (!notificationSnapshot.exists()) {
        console.log('Notification document does not exist.');
        return 'failure';
      }

      const organizationCollection = collection(
        firestore,
        ORGANIZATIONS_COLLECTION,
      );
      const organizationRef = doc(organizationCollection, organizationId);
      const organizationSnapshot = await getDoc(organizationRef);

      if (!organizationSnapshot.exists()) {
        console.log('Organization document does not exist.');
        return 'failure';
      }

      if (type === 'accept') {
        const updatedData = {
          accept: true,
        };
        await updateDoc(notificationRef, updatedData);
      } else {
        const updatedData = {
          seen: true,
        };
        await updateDoc(notificationRef, updatedData);
      }

      console.log('Notification updated successfully.');
      return 'success';
    },
    [firestore],
  );
}
