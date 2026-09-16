import { FirebaseAdminAppParams } from '../types/firebase-admin-app-params';

/**
 * @name createFirebaseAdminApp
 * @param params
 */
export async function createFirebaseAdminApp(params: FirebaseAdminAppParams) {
  const { getApps, getApp, cert, initializeApp } = await import(
    'firebase-admin/app'
  );

  if (getApps().length > 0) {
    return getApp();
  }

  // No service account: we are pointed at the emulators, which do not check
  // credentials. See `initializeFirebaseAdminApp`.
  if (!params.clientEmail || !params.privateKey) {
    return initializeApp({
      projectId: params.projectId,
      storageBucket: params.storageBucket,
    });
  }

  const privateKey = formatFirebasePrivateKey(params.privateKey);

  const credential = cert({
    projectId: params.projectId,
    clientEmail: params.clientEmail,
    privateKey,
  });

  return initializeApp({
    credential,
    projectId: params.projectId,
    storageBucket: params.storageBucket,
  });
}

function formatFirebasePrivateKey(key: string) {
  return key.replace(/\\n/g, '\n');
}
