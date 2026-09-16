import { getUsersCollection } from '~/lib/server/collections';

interface Params {
  userId: string;
  name: string;
  lastName: string;
  email: string;
}

/**
 * @name createUser
 * @description Handles the submission of the join non authenticated user flow. By default,
 * we use the submission to create the user record
 * associated with the User who signed up using its ID
 * @param userId
 * @param organizationName
 */
export async function createUser({ userId, name, lastName, email }: Params) {
  const userRef = getUsersCollection().doc(userId);
  const searchableName = (name + lastName).replace(' ', '').toLowerCase();
  const data = {
    name: name,
    lastName: lastName,
    fullName: name + ' ' + lastName,
    searchableName,
    searchableLastName: lastName.toLowerCase(),
    createdAt: new Date().getTime(),
    email,
  };

  try {
    return new Promise((resolve, reject) => {
      userRef
        .set(data, { merge: true })
        .then(() => {
          resolve('success');
        })
        .catch((error) => {
          console.error('Error', error);
          reject('error');
        });
    });
  } catch (error) {
    console.error('Error', error);
    return 'error';
  }
}
