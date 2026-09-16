import {
  onDocumentDeleted,
  onDocumentCreated,
} from 'firebase-functions/v2/firestore';
import * as logger from 'firebase-functions/logger';

import { initializeFirebaseAdmin } from '../firebaseAdmin';

initializeFirebaseAdmin();

export const TeamCreate = onDocumentCreated(
  `organizations/{organizationId}/teams/{teamsId}`,
  async (event) => {
    const { organizationId, teamsId } = event.params;
    logger.info('Team created', { organizationId, teamsId });
  },
);

export const TeamDelete = onDocumentDeleted(
  `organizations/{organizationId}/teams/{teamId}`,
  async (event) => {
    const { organizationId, teamId } = event.params;
    logger.info('Team deleted', { organizationId, teamId });
  },
);
