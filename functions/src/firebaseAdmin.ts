// firebaseAdmin.ts
import * as admin from 'firebase-admin';
import { initializeApp } from 'firebase-admin/app';

require('dotenv').config();

export const initializeFirebaseAdmin = () => {
    if (!admin.apps.length) {
        const base64Credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS as string;
        const credentials = JSON.parse(Buffer.from(base64Credentials, 'base64').toString('utf8'));
        initializeApp({
            credential: admin.credential.cert(credentials),
        });
    }
};
