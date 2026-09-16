import { getAuth } from 'firebase-admin/auth';
import { MembershipRole } from '~/lib/organizations/types/membership-role';
import { getOrganizationsCollection, getUsersCollection } from '../collections';
import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';
import configuration from '~/configuration';

import { sendEmail } from '~/lib/server/email/send-email';
interface Params {
    organizationName: string;
    teamName: string;
    name: string;
    lastName: string;
    email: string;
    password?: string;
}

function sendNotificationEmail(props: {
    name: string;
    subscription: string;
    email: string;
}) {
    const { name, subscription, email } = props;

    const link = getInvitePageFullUrl();

    let data: any = {
        to: email,
        subject: `Welcome to Retroteam!`,
        template: 'welcome-email-template',
        'v:name': name,
        'v:subscription': subscription,
        'v:email': email,
        'v:link': link,
    };

    if (email) {
        void sendEmail(data);
    }
}

/**
 * @name createOrganization
 * @description Handles the submission of the onboarding flow. By default,
 * we use the submission to create the Organization and the user record
 * associated with the User who signed up using its ID
 * @param userId
 * @param organizationName
 */


export async function createOrganization({
    organizationName,
    teamName,
    name,
    lastName,
    email,
    password
}: Params) {

    function encodeEmailToId(email: string): string {
        return Buffer.from(email).toString('base64url');
    }

    const uid = encodeEmailToId(email);
    const auth = getAuth();

    // Check if the user exists in Firebase Auth
    try {
        const userRecord = await auth.getUser(uid);
        if (userRecord) {
            return {
                success: false,
                message: 'The email address is already in use by another account.',
            };
        }

    } catch (error: any) {

        if (error.code === 'auth/user-not-found') {
            const userData: any = {
                uid,
                email,
            };

            if (password) {
                userData.password = password;
            }

            await auth.createUser(userData);
        } else {
            console.error('Firebase Auth error:', error);
            return {
                success: false,
                message: error,
            };
        }
    }

    const sendEmailRequest = () =>
        sendNotificationEmail({
            name: name + ' ' + lastName,
            subscription: 'Free Subscription',
            email,
        });
    const firestore = getRestFirestore();

    const batch = firestore.batch();

    const organizationRef = getOrganizationsCollection().doc();
    const userRef = getUsersCollection().doc(uid);
    const userId = uid

    const searchableName = (name + lastName).replace(' ', '').toLowerCase();

    const data = {
        name: name,
        lastName: lastName,
        email: email,
        fullName: name + ' ' + lastName,
        searchableName,
        searchableLastName: lastName.toLowerCase(),
        createdAt: new Date().getTime(),
    };

    try {
        await userRef.set(data, { merge: true });

        const organizationMembers = {
            [userId]: {
                user: userRef,
                role: MembershipRole.Admin,
                userId
            },
        };
        const searchableOrganizaitonName = organizationName
            .replace(' ', '')
            .toLowerCase();

        // Create organization body
        const organizationData: Record<string, any> = {
            name: organizationName,
            searchableName: searchableOrganizaitonName,
            members: organizationMembers,
            invites: 0,
            aiCounter: 0,
            createdAt: new Date().getTime(),
        };

        // Crear organization document
        batch.create(organizationRef, organizationData);


        const membersCollectionRef = organizationRef.collection('users');

        const membersDocRef = membersCollectionRef.doc(userId);
        batch.create(membersDocRef, {
            user: userRef,
            role: MembershipRole.Admin,
            userId,
        });
        // Create a subcollection called 'teams' under the organization document
        const teamsCollectionRef = organizationRef.collection('teams');

        const searchableName = teamName.replace(' ', '').toLowerCase();

        const teamDocRef = teamsCollectionRef.doc();
        const teamData = {
            id: teamDocRef.id,
            name: teamName,
            createdAt: new Date(),
            searchableName,
            members: {
                [userId]: {
                    userId,
                    user: userRef,
                    active: true,
                    // role: 1,
                },
            },
        };
        batch.create(teamDocRef, teamData);

        // Create a subcollection called 'users' under the organization document
        const usersCollectionRef = teamDocRef.collection('users');

        const usersDocRef = usersCollectionRef.doc(userId);

        const usersData = {
            userId: userId,
            user: userRef,
            // role: MembershipRole.Admin,
            active: true,
            createdAt: new Date().getTime(),
        };
        batch.create(usersDocRef, usersData);

        await batch.commit().then(() => {
            sendEmailRequest();
        });

        // Set user as "onboarded" using custom claims
        await auth.setCustomUserClaims(userId, {
            onboarded: true,
        });

        return {
            success: true,
        };
    } catch (error) {
        console.error('Error', error);
        return {
            success: false,
            message: error,
        };
    }
}

/*
 * @name getInvitePageFullUrl
 * @description Return the full URL to the invite page link. For example,
 * <your-site-url>/auth/invite/{INVITE_CODE}
 * @param inviteCode
 */
function getInvitePageFullUrl() {
    let siteUrl = configuration.site.siteUrl;
    assertSiteUrl(siteUrl);
    const url = [siteUrl, 'retrospectives', 'create'].join('/');
    return url;
}

function assertSiteUrl(siteUrl: Maybe<string>): asserts siteUrl is string {
    if (!siteUrl && configuration.production) {
        throw new Error(
            `Please configure the "siteUrl" property in the configuration file ~/configuration.ts`,
        );
    }
}
