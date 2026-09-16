export interface FirebaseAdminAppParams {
  projectId: string;
  storageBucket: string;

  // Omitted when running against the Firebase Emulator Suite, which accepts an
  // unauthenticated Admin SDK. Required otherwise.
  clientEmail?: string;
  privateKey?: string;
}
