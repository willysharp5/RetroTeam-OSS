import {
  onDocumentCreated,
  onDocumentDeleted,
  onDocumentUpdated
} from 'firebase-functions/v2/firestore';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import { firestore } from 'firebase-admin';

import { initializeFirebaseAdmin } from '../firebaseAdmin';

initializeFirebaseAdmin();

export const RetrospectiveCreate = onDocumentCreated(
  `organizations/{organizationId}/retrospectives/{retrospectiveId}`,
  async (event) => {
    const retrospectiveId = event.params.retrospectiveId;
    const organizationId = event.params.organizationId;

    logger.info('Retrospective created', { retrospectiveId, organizationId });
  },
);

export const RetrospectiveUpdate = onDocumentUpdated(
  `organizations/{organizationId}/retrospectives/{retrospectiveId}`,
  async (event: any) => {
    const change = event.data;
    const retrospectiveId = event.params.retrospectiveId;
    const organizationId = event.params.organizationId;
    const newData = change.after.data();

    if (newData.date && newData.date.toMillis) {
      newData.date = newData.date.toMillis();
    }

    const type = newData.access.type;
    const pathSegments = newData.team._path.segments;
    const teamId = pathSegments[pathSegments.length - 1];

    logger.info('Retrospective updated', {
      retrospectiveId,
      organizationId,
      type,
    });

    // Update board document with new team reference
    const boardRef = admin
      .firestore()
      .doc(`organizations/${organizationId}/board/${retrospectiveId}`);

    const boardSnapshot = await boardRef.get();

    if (boardSnapshot.exists) {
      await boardRef.update({
        teamId,
        teamRef: newData.team,
      });

      logger.info(`Board ${retrospectiveId} updated team ${teamId}.`);
    }

    // Update board actions with new team
    const actionRef = admin
      .firestore()
      .collection(`organizations/${organizationId}/board/${retrospectiveId}/actions`);

    const actionSnapshot = await actionRef.get();

    if (!actionSnapshot.empty) {
      for (const doc of actionSnapshot.docs) {
        await doc.ref.update({
          team: teamId,
        });

        logger.info(`Action ${doc.id} updated with new team ${teamId}.`);
      }

      logger.info(`All actions for retrospective ${retrospectiveId} updated with new team.`);
    } else {
      logger.info(`No actions found for retrospective ${retrospectiveId}.`);
    }
  },
);

export const RetrospectiveDelete = onDocumentDeleted(
  `organizations/{organizationId}/retrospectives/{retrospectiveId}`,
  async (event) => {
    const retrospectiveId = event.params.retrospectiveId;
    const organizationId = event.params.organizationId;

    logger.info('Retrospective deleted', { retrospectiveId });

    try {
      const boardRef = firestore().doc(`organizations/${organizationId}/board/${retrospectiveId}`);
      await deleteBoardAndSubcollections(boardRef);
      logger.info('Board and subcollections deleted', { retrospectiveId });
    } catch (error: any) {
      logger.error('Error processing document deletion', {
        error: error.message,
        stack: error.stack,
      });
    }
  },
);

export const GroupingCreate = onDocumentCreated(
  `organizations/{organizationId}/board/{retrospectiveId}/groups/{groupId}`,
  async (event) => {
    const snap = event.data as any;
    const data = snap.data();
    const retrospectiveId = event.params.retrospectiveId;
    const organizationId = event.params.organizationId;
    const groupId = event.params.groupId;

    logger.info('Group created', { retrospectiveId, organizationId, groupId });

    try {
      if (!data.comments || typeof data.comments !== 'object') {
        logger.warn('No comments found or comments is not an object');
        return;
      }

      const commentsEntries = Object.entries(data.comments);

      const updatePromises = commentsEntries.map(async ([key, comment]: [string, any]) => {
        logger.info('Processing comment:', comment.id);

        const commentRef = admin.firestore().collection("organizations").doc(organizationId).collection("board").doc(retrospectiveId).collection("comments").doc(comment.id);

        await commentRef.update({ group: groupId, status: data.status, votes: 0, voters: [] });
        logger.info(`Updated comment ${comment.id} with group ${groupId}`);
      });

      await Promise.all(updatePromises);
      logger.info('All comments updated successfully');
    } catch (error) {
      logger.error('Error updating comments:', error);
    }
  },
);

export const GroupingUpdate = onDocumentUpdated(
  `organizations/{organizationId}/board/{retrospectiveId}/groups/{groupId}`,
  async (event) => {
    const change = event.data;
    const newData = change?.after.data();
    const pastData = change?.before.data();
    const retrospectiveId = event.params.retrospectiveId;
    const organizationId = event.params.organizationId;
    const groupId = event.params.groupId;

    logger.info('Group updated', { retrospectiveId, organizationId, groupId });

    try {

      const newCommentIds = Object.keys(newData?.comments || {});
      const pastCommentIds = Object.keys(pastData?.comments || {});

      const addedComments = newCommentIds.filter(id => !pastCommentIds.includes(id));

      const voteCalculationPromise = newData?.voters ? (async () => {
        logger.info('Starting vote calculation', { voters: newData.voters });

        const totalVotes = Object.values(newData.voters).reduce((total: number, voter: any) => {
          const voterVotes = voter.votes || 0;
          return total + voterVotes;
        }, 0);

        logger.info('Calculating total votes for group', {
          groupId,
          totalVotes,
          voters: Object.keys(newData.voters).length,
        });

        const groupRef = admin.firestore()
          .collection("organizations").doc(organizationId)
          .collection("board").doc(retrospectiveId)
          .collection("groups").doc(groupId);

        await groupRef.update({ votes: totalVotes });
        logger.info(`Updated group ${groupId} with total votes: ${totalVotes}`);
      })() : (async () => {
        logger.warn('No voters found in newData, skipping vote calculation');
      })();

      if (addedComments.length === 0) {
        await voteCalculationPromise;
        return;
      }

      const updatePromises = addedComments.map(async (commentId: string) => {
        logger.info('Processing comment:', commentId);

        const commentRef = admin.firestore()
          .collection("organizations").doc(organizationId)
          .collection("board").doc(retrospectiveId)
          .collection("comments").doc(commentId);

        await commentRef.update({ group: groupId, status: newData?.status, votes: 0, voters: [] });
        logger.info(`Updated comment ${commentId} with group ${groupId}`);
      });

      await Promise.all([...updatePromises, voteCalculationPromise]);

    } catch (error) {
      logger.error('Error updating comments:', error);
    }
  },
);

export const CommentUpdate = onDocumentUpdated(
  `organizations/{organizationId}/board/{retrospectiveId}/comments/{commentId}`,
  async (event) => {
    const change = event.data;
    const newData = change?.after.data();
    const retrospectiveId = event.params.retrospectiveId;
    const organizationId = event.params.organizationId;
    const commentId = event.params.commentId;

    logger.info('Comment updated', { retrospectiveId, organizationId, commentId });

    try {
      const voteCalculationPromise = newData?.voters ? (async () => {
        logger.info('Starting vote calculation for comment', { voters: newData.voters });

        const totalVotes = Object.values(newData.voters).reduce((total: number, voter: any) => {
          const voterVotes = voter.votes || 0;
          return total + voterVotes;
        }, 0);

        logger.info('Calculating total votes for comment', {
          commentId,
          totalVotes,
          voters: Object.keys(newData.voters).length,
        });

        const commentRef = admin.firestore()
          .collection("organizations").doc(organizationId)
          .collection("board").doc(retrospectiveId)
          .collection("comments").doc(commentId);

        await commentRef.update({ votes: totalVotes });
        logger.info(`Updated comment ${commentId} with total votes: ${totalVotes}`);

        if (newData?.group) {
          logger.info('Comment belongs to a group, updating group votes', { groupId: newData.group });
          
          const groupRef = admin.firestore()
            .collection("organizations").doc(organizationId)
            .collection("board").doc(retrospectiveId)
            .collection("groups").doc(newData.group);

          const groupDoc = await groupRef.get();
          if (groupDoc.exists) {
            const groupData = groupDoc.data();
            const groupVoters = groupData?.voters || {};
            
            const groupTotalVotes = Object.values(groupVoters).reduce((total: number, voter: any) => {
              return total + (voter.votes || 0);
            }, 0);

            await groupRef.update({ votes: groupTotalVotes });
            logger.info(`Updated group ${newData.group} with total votes: ${groupTotalVotes}`);
          } else {
            logger.warn('Group not found', { groupId: newData.group });
          }
        }
      })() : (async () => {
        logger.warn('No voters found in newData, skipping vote calculation');
      })();

      await Promise.all([voteCalculationPromise]);

    } catch (error) {
      logger.error('Error updating comment votes:', error);
    }
  },
);


async function deleteBoardAndSubcollections(docRef: FirebaseFirestore.DocumentReference) {
  const batch = firestore().batch();

  const subcollections = await docRef.listCollections();
  for (const subcollection of subcollections) {
    const docs = await subcollection.listDocuments();
    docs.forEach((doc) => {
      batch.delete(doc);
    });
  }

  batch.delete(docRef);

  await batch.commit();
}
