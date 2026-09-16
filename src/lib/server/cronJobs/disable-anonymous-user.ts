import configuration from '~/configuration';
import admin from 'firebase-admin';
import { getRules } from '../collections';
import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';
import { ORGANIZATIONS_COLLECTION } from '~/lib/firestore-collections';

export default async function disableAnonymousUsers() {
  if (!admin.apps.length) {
    const base64Credentials =
      configuration.firebase.googleApplicationCredentials;
    const credentials = JSON.parse(atob(base64Credentials));

    admin.initializeApp({
      credential: admin.credential.cert(credentials),
    });
  }
  try {
    const auth = admin.auth();

    const rules = await getRules().where('section', '==', 'users').get();

    let expirateDays = 14;

    const firestore = getRestFirestore();

    for (const doc of rules.docs) {
      const data = doc.data();
      expirateDays = data.expireAnonymousAccounts;
    }

    const expirationTimeInMillis = expirateDays * 24 * 60 * 60 * 1000;
    const now = Date.now();

    const disabledUsers = [] as any;
    const listUsersResult = await auth.listUsers();

    const promises = listUsersResult.users.map(async (userRecord) => {

      // If user is anonymous
      if (userRecord.providerData.length === 0) {

        const creationTime = new Date(
          userRecord.metadata.creationTime,
        ).getTime();
        const isExpired = now - creationTime > expirationTimeInMillis;

        if (isExpired && !userRecord.disabled) {

          await auth.updateUser(userRecord.uid, {
            disabled: true,
          });
          disabledUsers.push(userRecord.uid);
          
          // Search organization where the member is part of
          const orgsSnapshot = await firestore
            .collection(ORGANIZATIONS_COLLECTION)
            .where(`members.${userRecord.uid}`, '!=', null)
            .get();

          await Promise.all(
            orgsSnapshot.docs.map(async (orgDoc) => {
              const orgId = orgDoc.id;

              // Search teams where the member is part of 
              const teamsSnapshot = await firestore
                .collection(ORGANIZATIONS_COLLECTION)
                .doc(orgId)
                .collection('teams')
                .where(`members.${userRecord.uid}`, '!=', null)
                .get();

              // Update team status to false
              const updates = teamsSnapshot.docs.map((teamDoc) => {
                const teamRef = teamDoc.ref;
                const memberDocRef = teamRef.collection('users').doc(userRecord.uid);
                console.log('User deactivated: ', userRecord.uid + 'from team: ' + teamDoc.id);
                return Promise.all([
                  teamRef.update({
                    [`members.${userRecord.uid}.active`]: false,
                  }),
                  memberDocRef.update({
                    active: false,
                  }),
                ]);
              });
              return Promise.all(updates);
            })

          );
        }
      }
    });

    await Promise.all(promises);

    let message = `Disabled users: ${disabledUsers}`;

    if (disabledUsers.length === 0) {
      message = 'There are no expired accounts';
    }

    return { success: true, data: message };
  } catch (error) {
    console.error('Error listing users:', error);
    return { success: false, error };
  }
}
