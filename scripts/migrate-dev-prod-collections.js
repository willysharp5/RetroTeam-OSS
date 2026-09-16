const admin = require('firebase-admin');

// Initialize Firebase source
const sourceApp = admin.initializeApp(
  {
    credential: admin.credential.cert(
      require('../accountServices/retroteam-app-dev-firebase-adminsdk.json'),
    ),
  },
  'sourceApp',
);
const sourceDb = sourceApp.firestore();

// Initialize Firebase target
const targetApp = admin.initializeApp(
  {
    credential: admin.credential.cert(
      require('../accountServices/retroteam-app-firebase-adminsdk.json'),
    ),
  },
  'targetApp',
);
const targetDb = targetApp.firestore();

// Collections to migrate
const collections = [
  'bulletPlans',
  'docs',
  'icebreakers',
  'rules',
  'tags',
  'templates',
  'demo'
];

// Recursive function to copy a document and its subcollections
async function copyDocumentAndSubcollections(sourceDocRef, targetDocRef) {
  const docSnap = await sourceDocRef.get();

  if (!docSnap.exists) return;

  // Copy main document data
  await targetDocRef.set(docSnap.data());
  console.log(`Document ${sourceDocRef.path} copied.`);

  // Get subcollections
  const subcollections = await sourceDocRef.listCollections();

  for (const subCol of subcollections) {
    const subColSnap = await subCol.get();
    const subColRef = targetDocRef.collection(subCol.id);

    for (const subDoc of subColSnap.docs) {
      await copyDocumentAndSubcollections(subDoc.ref, subColRef.doc(subDoc.id));
    }
  }
}

async function migrateCollection(collectionName) {
  try {
    console.log(`Starting migration of the collection: ${collectionName}...`);

    const snapshot = await sourceDb.collection(collectionName).get();

    if (snapshot.empty) {
      console.log(`No documents found in collection: ${collectionName}`);
      return;
    }

    for (const doc of snapshot.docs) {
      const sourceDocRef = sourceDb.collection(collectionName).doc(doc.id);
      const targetDocRef = targetDb.collection(collectionName).doc(doc.id);

      await copyDocumentAndSubcollections(sourceDocRef, targetDocRef);
    }

    console.log(`Migration completed for collection: ${collectionName}`);
  } catch (error) {
    console.error(`Error during migration of ${collectionName}:`, error);
  }
}

// Migrate all collections
(async () => {
  for (const collection of collections) {
    await migrateCollection(collection);
  }
})();
