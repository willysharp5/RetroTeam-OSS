import { getOrganizationsCollection, getUsersCollection } from '~/lib/server/collections';

import admin from 'firebase-admin';
import configuration from '~/configuration';
import { Organization } from '~/lib/organizations/types/organization';

import { sendEmail } from '~/lib/server/email/send-email';
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
    });
}



const auth = admin.auth();

/**
 * @name deactivateAccount
 * @description Hook to deactivate an account by ID
 */
interface Params {
    id: string;
    organizationId: string;
}

export async function deactivateAccount({ id, organizationId }: Params) {

    try {
        const userRef = getUsersCollection().doc(id);
        const organizationRef = getOrganizationsCollection().doc(organizationId);
        const docSnapshot = await userRef.get();
        const organizationSnapshot = await organizationRef.get();
        const organizationData = organizationSnapshot.data() as any;
        if (docSnapshot.exists) {
            const user = docSnapshot.data() as any;
            await auth.updateUser(id, {
                disabled: true,
            });

            user.id = id
            organizationData.id = organizationId
            sendNotificationEmailToUser({ email: user?.email as string, organizationName: organizationData?.name as string, userName: user?.fullName as string })
            sendNotificationEmailToSuperAdmin({ email: user?.email as string, organization: organizationData, user: user })

            return { success: true };
        } else {
            return {
                success: false,
                message: `User with ID ${id} does not exist.`,
            };
        }
    } catch (error) {
        console.error('Error', error);
        return {
            success: false,
            message: 'An error occurred while deleting the organization.',
        };
    }

}

function sendNotificationEmailToUser(props: {
    email: string;
    organizationName: string;
    userName: string;
}) {
    const { email, organizationName, userName } = props;

    let data: any = {
        to: email,
        subject: `RetroTeam Account Deleted`,
        template: 'disabled user account',
        'v:userName': userName,
        'v:organizationName': organizationName,
        'v:email': email,
    };

    if (email) {
        void sendEmail(data);
    }
}

function sendNotificationEmailToSuperAdmin(props: {
    email: string;
    organization: any;
    user: any;
}) {
    const { email, organization, user } = props;

    const siteUrl = configuration.site.siteUrl;
    let data: any = {
        to: configuration.email.contactEmail,
        subject: `${user.fullName} has Deleted the Account for ${organization.name}.`,
        template: 'admin message',
        'v:userName': user.fullName,
        'v:organizationName': organization.name,
        'v:userId': user.id,
        'v:userEmail': user.email,
        'v:organizationId': organization.id,
        'v:customerId': organization.customerId ? organization.customerId : '',
        'v:adminOrganizationsLink': `${siteUrl}/admin/organizations`,
        'v:adminUsersLink': `${siteUrl}/admin/users`,
    };

    if (email) {
        void sendEmail(data);
    }
}