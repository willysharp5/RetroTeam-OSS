import { FirestoreProvider, useFirebaseApp } from 'reactfire';
import { useMemo } from 'react';

import {
  connectFirestoreEmulator,
  Firestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

import { isBrowser } from '~/core/generic/is-browser';
import configuration from '~/configuration';

const localCache = isBrowser()
  ? persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    })
  : undefined;

let firestore: Firestore;

export default function FirebaseFirestoreProvider({
  children,
  useEmulator,
}: React.PropsWithChildren<{ useEmulator?: boolean }>) {
  const app = useFirebaseApp();
  const firestoreConfig = useFirestoreConfig();

  if (firestore) {
    return <FirestoreProvider sdk={firestore}>{children}</FirestoreProvider>;
  }

  firestore = initializeFirestore(app, firestoreConfig);

  const isEmulatorEnv = configuration.emulator ?? useEmulator;

  // Without this, the client talks to Google's Firestore instead of the local
  // emulator. Against a demo project that fails as "Permission denied on
  // resource project <id>", the SDK gives up and goes offline, and because we
  // use `persistentLocalCache` every later read surfaces as "Failed to get
  // document because the client is offline" -- which reads like a network
  // problem rather than a client pointed at the wrong backend.
  //
  // This has to happen after `initializeFirestore` and before the first
  // operation, which the `firestore` guard above already guarantees: we only
  // get here once per module instance.
  if (isEmulatorEnv) {
    try {
      connectFirestoreEmulator(
        firestore,
        getFirestoreHost(),
        getFirestorePort(),
      );
    } catch (e) {
      // Hot reloading can re-evaluate this module while the SDK instance
      // survives, and connecting twice throws. Worth a line in the console --
      // silently swallowing it is how the commented-out original hid the fact
      // that nothing was connecting at all.
      console.warn('Could not connect to the Firestore emulator', e);
    }
  }

  return <FirestoreProvider sdk={firestore}>{children}</FirestoreProvider>;
}

function getFirestoreHost() {
  return (
    process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST ??
    configuration.emulatorHost ??
    'localhost'
  );
}

function getFirestorePort() {
  return Number(process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT ?? 8080);
}

/**
 * @description Check that Cypress is attached to the global window object.
 * If so, we're running in a testing environment
 */
function isTestEnv() {
  return isBrowser() && 'Cypress' in window;
}

/**
 * @description The configuration below is needed to make Firestore work with
 * Cypress. Otherwise, it will hang.
 */
function useFirestoreConfig() {
  return useMemo(() => {
    if (isTestEnv()) {
      return {
        ssl: false,
        host: '',
        experimentalForceLongPolling: true,
        localCache,
      };
    }

    return {
      localCache,
    };
  }, []);
}
