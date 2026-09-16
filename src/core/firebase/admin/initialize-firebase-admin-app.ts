import configuration from '~/configuration';

/**
 * @description Initializes the firebase Admin app.
 * If emulator=true, will start the emulator admin
 */
export async function initializeFirebaseAdminApp() {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  const projectId = configuration.firebase.projectId;
  const storageBucket = configuration.firebase.storageBucket;

  const { createFirebaseAdminApp } = await import('./create-admin-app');

  // Running against the Firebase Emulator Suite: the emulators accept an
  // unauthenticated Admin SDK, so a service account is not required. This is
  // what makes the zero-cost local setup work with no Firebase account at all.
  if (configuration.emulator) {
    if (!projectId || !storageBucket) {
      throw new Error(
        `Cannot create Firebase Admin App. Please provide NEXT_PUBLIC_FIREBASE_PROJECT_ID and NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`,
      );
    }

    setEmulatorHosts();

    return createFirebaseAdminApp({
      projectId,
      storageBucket,
    });
  }

  // assert all values have been provided
  if (!projectId || !privateKey || !clientEmail || !storageBucket) {
    throw new Error(
      `Cannot create Firebase Admin App. Please provide all the required parameters`,
    );
  }

  return createFirebaseAdminApp({
    projectId,
    storageBucket,
    clientEmail,
    privateKey,
  });
}

/**
 * @name setEmulatorHosts
 * @description The Admin SDK only talks to the emulators when these variables
 * are set, and it reads them from the environment rather than from any
 * initialization option. We default them from the same variables the client
 * SDK uses, so `NEXT_PUBLIC_EMULATOR=true` is enough on its own.
 */
function setEmulatorHosts() {
  const host = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST ?? 'localhost';

  const hosts: Record<string, string> = {
    FIREBASE_AUTH_EMULATOR_HOST: `${host}:${
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT ?? '9099'
    }`,
    FIRESTORE_EMULATOR_HOST: `${host}:${
      process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT ?? '8080'
    }`,
    FIREBASE_STORAGE_EMULATOR_HOST: `${host}:${
      process.env.NEXT_PUBLIC_STORAGE_EMULATOR_PORT ?? '9199'
    }`,
  };

  for (const [name, value] of Object.entries(hosts)) {
    // never override an explicitly configured host
    if (!process.env[name]) {
      process.env[name] = value;
    }
  }
}
