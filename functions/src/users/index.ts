import {
    onDocumentCreated,
    onDocumentDeleted,
    onDocumentUpdated
} from 'firebase-functions/v2/firestore';
import * as logger from 'firebase-functions/logger';
import { auth } from 'firebase-admin';
import { initializeFirebaseAdmin } from '../firebaseAdmin';

initializeFirebaseAdmin();

export const UserCreate = onDocumentCreated(
    `users/{userId}`,
    async (event) => {
        const { userId } = event.params;
        logger.info('User created: ' + userId);
    }
);

export const UserUpdate = onDocumentUpdated(
    `users/{userId}`,
    async (event) => {
        const userId = event.params.userId;
        logger.info('User updated', { userId });
    }
);

export const UserDelete = onDocumentDeleted(
    `users/{userId}`,
    async (event) => {
        const userId = event.params.userId;
        logger.info('User deleted', { userId });
    },
);
