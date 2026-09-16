import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

// ACTIONS BOARD NOTIFICATIONS

export const createNotification = async (data: any, organizationId: string, retrospectiveId: string) => {
    const assigneeRef = admin.firestore().collection('users').doc(data.assignee);
    const assigneSnap = await assigneeRef.get();
    const assigneeData = assigneSnap.exists ? assigneSnap.data() : null;

    if (!assigneeData) {
        console.log(`User data not found for assignee: ${data.assignee}`);
        return;
    }

    const facilitatorRef = admin.firestore().collection('users').doc(data.author);
    const facilitatorSnap = await facilitatorRef.get();
    const facilitatorData = facilitatorSnap.exists ? facilitatorSnap.data() : null;

    if (!facilitatorData) {
        console.log(`User data not found for facilitator: ${data.author}`);
        return;
    }

    const notificationRef = admin.firestore()
        .collection('organizations')
        .doc(organizationId)
        .collection('notifications')
        .doc();

    const retrospectiveRef = admin.firestore()
        .collection('organizations')
        .doc(organizationId)
        .collection('retrospectives')
        .doc(retrospectiveId);

    const retrospectiveSnap = await retrospectiveRef.get();
    const retrospectiveData = retrospectiveSnap.exists ? retrospectiveSnap.data() : null;

    if (!retrospectiveData) {
        console.log(`Retrospective data not found for ID: ${retrospectiveId}`);
        return;
    }

    const notificationData = {
        title: 'Added',
        created: new Date(),
        category: 'added',
        type: 'actions',
        subtitle: `<p>You have been added to <a href="/board/${retrospectiveId}#actions" class="text-blue-500 underline"><b>${retrospectiveData.name}</b></a> Action by <b>${facilitatorData.fullName}</b> </p>`,
        information: {
            organization: organizationId,
            teamId: data.team,
            retrospectiveId: retrospectiveId
        },
        email: assigneeData?.email,
        id: notificationRef.id,
        seen: false,
    };

    await notificationRef.set(notificationData);
};

export const createNotificationForUpdate = async (
    data: any,
    organizationId: string,
    retrospectiveId: string,
    isRemoval: boolean = false,
    facilitator: string
) => {
    const notificationRef = admin.firestore()
        .collection('organizations')
        .doc(organizationId)
        .collection('notifications')
        .doc();

    const userDocRef = admin
        .firestore()
        .collection('users')
        .doc(data.assignee);
    const userDoc = await userDocRef.get();
    const userData = userDoc.data() as any;

    const retrospectiveRef = admin.firestore()
        .collection('organizations')
        .doc(organizationId)
        .collection('retrospectives')
        .doc(retrospectiveId);

    const retrospectiveSnap = await retrospectiveRef.get();
    const retrospectiveData = retrospectiveSnap.exists ? retrospectiveSnap.data() : null;

    if (!retrospectiveData) {
        console.log(`Retrospective data not found for ID: ${retrospectiveId}`);
        return;
    }

    const subtitle = isRemoval
        ? `<p>You have been <b>removed</b> from a <a href="/board/${retrospectiveId}#actions" class="text-blue-500 underline"><b>${retrospectiveData.name}</b></a> Action by <b>${facilitator}</b> </p>`
        : `<p>You have been <b>added</b> to a <a href="/board/${retrospectiveId}#actions" class="text-blue-500 underline"><b>${retrospectiveData.name}</b></a> Action by <b>${facilitator}</b> </p>`;

    const notificationData = {
        title: isRemoval ? 'Removed' : 'Added',
        created: new Date(),
        category: isRemoval ? 'removed' : 'added',
        type: 'actions',
        subtitle,
        information: {
            organization: organizationId,
            //teamId: data.team,
            retrospectiveId: retrospectiveId
        },
        email: userData.email,
        id: notificationRef.id,
        seen: false,
    };

    await notificationRef.set(notificationData);

    logger.info(`Sent ${isRemoval ? 'remove' : 'add'} action notification`, {
        email: userData.email,
    });
};

