import { useFirestore } from 'reactfire';
import { collection, doc, getDocs, updateDoc, query, where, getDoc } from 'firebase/firestore';
import { useCallback } from 'react';

import {
  NOTIFICATIONS_COLLECTION,
  ORGANIZATIONS_COLLECTION,
} from '~/lib/firestore-collections';

export function useUpdateNotifications() {
  const firestore = useFirestore();

  return useCallback(
    async (organizationId: string, type: string, email: string) => {
      const notificationsCollection = collection(
        firestore,
        ORGANIZATIONS_COLLECTION,
        organizationId,
        NOTIFICATIONS_COLLECTION,
      );

      // Set up a query to get all notifications for the organization
      const notificationsQuery = query(notificationsCollection, where('seen', '==', false));

      // Get all notifications that match the query
      const notificationsSnapshot = await getDocs(notificationsQuery);

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

      const organization = organizationSnapshot.data();

      // Iterate through each notification and update it
      const promises = notificationsSnapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();

        if (type === 'accept') {
          const updatedData = {
            accept: true,
            subtitle: data.information.retrospectiveId
              ? `<p>You have been invited to <a href="${`/board/${data.information.retrospectiveId}`}"><b class="text-blue-500 underline">${data.information.retrospectiveName
              }</b></a> by <b>${data.information.facilitator}</b></p><p>Contact: <b>${email}</b></p>`
              : `<p>You have been invited to <a href="${`/settings/teams/${data.information.teamId}`}"><b class="text-blue-500 underline">${organization?.name} - ${data.information.teamName
              }</b></a> by <b>${data.information.facilitator}</b></p><p>Contact: <b>${email}</b></p>`,
          };
          await updateDoc(docSnapshot.ref, updatedData);
        } else {
          const updatedData = {
            seen: true,
          };
          await updateDoc(docSnapshot.ref, updatedData);
        }
      });

      // Wait for all updates to complete
      await Promise.all(promises);

      return 'success';
    },
    [firestore],
  );
}
