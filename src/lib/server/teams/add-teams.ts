import { getOrganizationsCollection } from '~/lib/server/collections';
import { MembershipRole } from '~/lib/organizations/types/membership-role';
import { USERS_COLLECTION } from '~/lib/firestore-collections';

import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';

interface Params {
  name: string;
  userId: string;
  organization: string;
}

export async function createTeam({ name, userId, organization }: Params) {
  const firestore = getRestFirestore();

  const batch = firestore.batch();

  const organizationRef = getOrganizationsCollection().doc(organization);

  try {
    // Create a subcollection called 'teams' under the organization document
    const teamsCollectionRef = organizationRef.collection('teams');

    const teamDocRef = teamsCollectionRef.doc();

    const userPath = `/${USERS_COLLECTION}/${userId}`;
    const userRef = firestore.doc(userPath);
    const searchableName = name.replace(' ', '').toLowerCase();
    const teamData = {
      id: teamDocRef.id,
      name: name,
      createdAt: new Date(),
      searchableName,
      members: {
        [userId]: {
          userId,
          user: userRef,
          active: true,
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
    //  role: MembershipRole.Admin,
      active: true,
      createdAt: new Date().getTime(),
    };
    batch.create(usersDocRef, usersData);

    await batch.commit();

    return teamDocRef.id;
  } catch (error) {
    console.error('Error', error);
  }
}
