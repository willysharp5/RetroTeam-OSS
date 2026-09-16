import {
    onDocumentCreated,
    onDocumentDeleted,
    onDocumentUpdated
} from 'firebase-functions/v2/firestore';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';

import { formatDate, formatTimestamp } from '../helpers';
import { createNotification, createNotificationForUpdate } from '../notifications';
import { initializeFirebaseAdmin } from '../firebaseAdmin';

initializeFirebaseAdmin();

// ORGANIZATION ACTIONS Functions

export const ActionCreate = onDocumentCreated(
    `organizations/{organizationId}/teams/{teamId}/actions/{actionId}`,
    async (event) => {
        const snap = event.data as any;
        const data = snap.data();
        const { teamId, organizationId, actionId } = event.params;

        logger.info('Organization action created', { teamId, organizationId, actionId });
    },
);

export const ActionUpdate = onDocumentUpdated(
    `organizations/{organizationId}/teams/{teamId}/actions/{actionId}`,
    async (event) => {
        const change = event.data as any;
        const teamId = event.params.teamId;
        const organizationId = event.params.organizationId;
        const actionId = event.params.actionId;
        const newData = change.after.data();
        const pastData = change.before.data();

        logger.info('Organization action updated', {
            teamId,
            organizationId,
            actionId,
        });
    }
);

export const ActionDelete = onDocumentDeleted(
    `organizations/{organizationId}/teams/{teamId}/actions/{actionId}`,
    async (event) => {
        const teamId = event.params.teamId;
        const organizationId = event.params.organizationId;
        const actionId = event.params.actionId;

        logger.info('Organization action deleted', {
            teamId,
            organizationId,
            actionId,
        });
    },
);

// BOARD ACTIONS Functions

export const BoardActionCreate = onDocumentCreated(
    `organizations/{organizationId}/board/{retrospectiveId}/actions/{actionId}`,
    async (event) => {
        const snap = event.data as any;
        const data = snap.data();
        const { retrospectiveId, organizationId, actionId } = event.params;

        logger.info('Board action created', { retrospectiveId, organizationId, actionId });

        try {
            if (data.assignee !== '' && data.author !== '') {
                await createNotification(data, organizationId, retrospectiveId);
            }
        } catch (error: any) {
            logger.error('Error processing action creation', {
                error: error.message || error,
            });
        }
    },
);

export const BoardActionUpdate = onDocumentUpdated(
    `organizations/{organizationId}/board/{retrospectiveId}/actions/{actionId}`,
    async (event) => {
        const change = event.data as any;
        const retrospectiveId = event.params.retrospectiveId;
        const organizationId = event.params.organizationId;
        const actionId = event.params.actionId;
        const newData = change.after.data();
        const pastData = change.before.data();

        logger.info('Board action updated', {
            retrospectiveId,
            organizationId,
            actionId,
        });

        try {
            if ((pastData.assignee !== newData.assignee) || (newData.team !== pastData.team)) {
                const userDocRef = admin
                    .firestore()
                    .collection('users')
                    .doc(newData.updatedBy);
                const userDoc = await userDocRef.get();
                const facilitatorData = userDoc.data() as any;
                const facilitator = facilitatorData.fullName;

                logger.info('Assignee updated', {
                    past: pastData.assignee,
                    new: newData.assignee,
                    actionId,
                });

                if (newData.assignee != '') {
                    await createNotificationForUpdate(newData, organizationId, retrospectiveId, false, facilitator);
                }
                if (pastData.assignee != '') {
                    await createNotificationForUpdate(pastData, organizationId, retrospectiveId, true, facilitator);
                }
            }
        }
        catch (error: any) {
            logger.error('Error processing action update', {
                error: error.message || error,
            });
        }
    }
);

export const BoardActionDelete = onDocumentDeleted(
    `organizations/{organizationId}/board/{retrospectiveId}/actions/{actionId}`,
    async (event) => {
        const retrospectiveId = event.params.retrospectiveId;
        const organizationId = event.params.organizationId;
        const actionId = event.params.actionId;

        logger.info('Board action deleted', {
            retrospectiveId,
            organizationId,
            actionId,
        });
    },
);
