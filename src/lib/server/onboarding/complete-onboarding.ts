import { getAuth } from 'firebase-admin/auth';
import { MembershipRole } from '~/lib/organizations/types/membership-role';
import { getOrganizationsCollection, getUsersCollection } from '../collections';
import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';
import configuration from '~/configuration';

import { sendEmail } from '~/lib/server/email/send-email';
interface Params {
  organizationName: string;
  teams: Team;
  userId: string;
  name: string;
  lastName: string;
  email: string;
}

interface Team {
  name: string;
}

function sendNotificationEmail(props: { name: string; email: string }) {
  const { name, email } = props;

  const link = getInvitePageFullUrl();

  let data: any = {
    to: email,
    subject: `Welcome to ${configuration.site.siteName}!`,
    template: 'welcome-email-template',
    'v:name': name,
    'v:email': email,
    'v:link': link,
  };

  if (email) {
    void sendEmail(data);
  }
}

/**
 * @name completeOnboarding
 * @description Handles the submission of the onboarding flow. By default,
 * we use the submission to create the Organization and the user record
 * associated with the User who signed up using its ID
 * @param userId
 * @param organizationName
 */


export async function completeOnboarding({
  userId,
  organizationName,
  teams,
  name,
  lastName,
  email,
}: Params) {
  const sendEmailRequest = () =>
    sendNotificationEmail({
      name: name + ' ' + lastName,
      email,
    });
  const firestore = getRestFirestore();
  const auth = getAuth();

  const batch = firestore.batch();

  const organizationRef = getOrganizationsCollection().doc();
  const userRef = getUsersCollection().doc(userId);

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
      },
    };
    const searchableOrganizaitonName = organizationName
      .replace(' ', '')
      .toLowerCase();
    // Create organization document
    batch.create(organizationRef, {
      name: organizationName,
      searchableName: searchableOrganizaitonName,
      members: organizationMembers,
      invites: 0,
      aiCounter: 0,
      createdAt: new Date().getTime(),
    });

    const membersCollectionRef = organizationRef.collection('users');

    const membersDocRef = membersCollectionRef.doc(userId);
    batch.create(membersDocRef, {
      user: userRef,
      role: MembershipRole.Admin,
      userId,
    });
    // Create a subcollection called 'teams' under the organization document
    const teamsCollectionRef = organizationRef.collection('teams');

    const searchableName = teams.name.replace(' ', '').toLowerCase();

    const teamDocRef = teamsCollectionRef.doc();
    const teamData = {
      id: teamDocRef.id,
      name: teams.name,
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
  } catch (error) {
    console.error('Error', error);
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
