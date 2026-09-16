import {
    onDocumentUpdated,
    onDocumentDeleted,
    onDocumentCreated,
} from 'firebase-functions/v2/firestore';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';

import { initializeFirebaseAdmin } from '../firebaseAdmin';

initializeFirebaseAdmin();

// ORGANIZATION Functions

export const OrganizationCreate = onDocumentCreated(
    `organizations/{organizationId}`,
    async (event) => {
        const { organizationId } = event.params;
        logger.info('Organization created', { organizationId });
    }
);

export const OrganiztionUpdate = onDocumentUpdated(
    `organizations/{organizationId}`,
    async (event: any) => {
        const organizationId = event.params.organizationId;

        logger.info(`Organization updated: ${organizationId}`);

        return null;
    },
);

export const OrganizationDelete = onDocumentDeleted(
    `organizations/{organizationId}`,
    async (event) => {
        const organizationId = event.params.organizationId;
        logger.info('Organization deleted', { organizationId });
    },
);

export const OrganizationMemberDelete = onDocumentDeleted(
    `organizations/{organizationId}/users/{userId}`,
    async (event) => {
        const userId = event.params.userId;
        const organizationId = event.params.organizationId;

        logger.info('Organization member deleted', { userId, organizationId });

        try {

            const teamsSnapshot = await admin.firestore().collection(`organizations/${organizationId}/teams`).get();

            for (const teamDoc of teamsSnapshot.docs) {
                const teamData = teamDoc.data();
                const teamId = teamDoc.id;
                if (teamData.members && teamData.members[userId]) {

                    const updatedMembers = { ...teamData.members };
                    delete updatedMembers[userId];

                    await admin.firestore().collection(`organizations/${organizationId}/teams`).doc(teamId).update({
                        members: updatedMembers,
                    });

                    logger.info(`User ${userId} removed from team ${teamId}`);
                }
                const userDocRef = admin.firestore().collection(`organizations/${organizationId}/teams/${teamId}/users`).doc(userId);
                const userDoc = await userDocRef.get();

                if (userDoc.exists) {
                    await userDocRef.delete();
                    logger.info(`User document ${userId} removed from team ${teamId}/users`);
                }
            }

            const retrospectiveSnapshot = await admin.firestore().collection(`organizations/${organizationId}/retrospectives`).get();

            for (const retrospectiveDoc of retrospectiveSnapshot.docs) {
                const retrospectiveData = retrospectiveDoc.data();
                const retrospectiveId = retrospectiveDoc.id;
                if (retrospectiveData.members && retrospectiveData.members[userId]) {

                    const updatedMembers = { ...retrospectiveData.members };
                    delete updatedMembers[userId];

                    await admin.firestore().collection(`organizations/${organizationId}/retrospectives`).doc(retrospectiveId).update({
                        members: updatedMembers,
                    });

                    logger.info(`User ${userId} removed from retrospective ${retrospectiveId}`);
                }
                const userDocRef = admin.firestore().collection(`organizations/${organizationId}/retrospectives/${retrospectiveId}/users`).doc(userId);
                const userDoc = await userDocRef.get();

                if (userDoc.exists) {
                    await userDocRef.delete();
                    logger.info(`User document ${userId} removed from retrospective ${retrospectiveId}/users`);
                }
            }

            logger.info(`User ${userId} removal process completed.`);
        } catch (error) {
            logger.error('Error removing user from teams/retrospectives and subcollections', { error });
        }
    }
);
