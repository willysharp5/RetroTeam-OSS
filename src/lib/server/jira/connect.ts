import { getOrganizationsCollection, getUsersCollection } from '~/lib/server/collections';
import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';

interface Params {
    organizationId: string;
    domain: string;
    accessToken: string;
    email: string
}

/**
 * @name connectJiraAccount
 * @description Hook to connect Jira Account to a user
 */

export async function connectJiraAccount({
    organizationId,
    domain,
    accessToken,
    email
}: Params) {
    const firestore = getRestFirestore();
    const batch = firestore.batch();
    const organizationRef = getOrganizationsCollection()
        .doc(organizationId);

    try {
        batch.update(organizationRef, {
            'jiraIntegration.domain': btoa(domain),
            'jiraIntegration.connected': true,
            'jiraIntegration.accessToken': btoa(accessToken),
            'jiraIntegration.email': email
        });

        await batch.commit();

        const snapshot = await organizationRef.get();
        const newData = snapshot.data();
        return newData;
    } catch (error) {
        console.error('Error', error);
    }
}
