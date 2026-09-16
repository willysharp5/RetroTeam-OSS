import { NextApiRequest, NextApiResponse } from 'next/types';
import { z } from 'zod';
import withCsrf from '~/core/middleware/with-csrf';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withPipe } from '~/core/middleware/with-pipe';
import { initializeFirebaseAdminApp } from '~/core/firebase/admin/initialize-firebase-admin-app';
import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';
import {
  formatSearchResponse,
  prefixFilter,
} from '~/lib/server/search/firestore-search-helpers';

const SUPPORTED_HTTP_METHODS: HttpMethod[] = ['POST'];

const Body = z.object({
  query: z.string(),
  organizationFilter: z.string(),
  teamId: z.string(),
  currentPage: z.number(),
  rowsPerPage: z.number(),
});

async function onHandler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await initializeFirebaseAdminApp();
    const firestore = getRestFirestore();

    const { query, organizationFilter, teamId, currentPage, rowsPerPage } =
      await Body.parseAsync(req.body);

    // The "action assignees" collection in Typesense was a denormalized list
    // of users who are assigned actions in the org/team. We replicate by
    // querying all actions in the team and collecting unique assignee IDs.

    const actionsRef = firestore
      .collection('organizations')
      .doc(organizationFilter)
      .collection('teams')
      .doc(teamId)
      .collection('actions');

    const actionsSnapshot = await actionsRef.select('assignee').get();

    const assigneeCounts = new Map<string, number>();
    actionsSnapshot.docs.forEach((doc) => {
      const assignee = doc.data().assignee;
      if (assignee) {
        assigneeCounts.set(assignee, (assigneeCounts.get(assignee) || 0) + 1);
      }
    });

    if (assigneeCounts.size === 0) {
      return res.status(200).json(formatSearchResponse([], 0, currentPage));
    }

    const assigneeIdsArray = Array.from(assigneeCounts.keys());
    const batchSize = 10;
    let allUsers: any[] = [];

    for (let i = 0; i < assigneeIdsArray.length; i += batchSize) {
      const batch = assigneeIdsArray
        .slice(i, i + batchSize)
        .filter((id): id is string => id != null && id !== '');
      if (batch.length === 0) continue;
      const usersSnapshot = await firestore
        .collection('users')
        .where('__name__', 'in', batch)
        .get();

      const users = usersSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: doc.id,
          fullName: data.fullName || data.name || '',
          email: data.email || '',
          photoUrl: data.photoUrl || '',
          organization: organizationFilter,
          team: teamId,
          actionsCount: assigneeCounts.get(doc.id) || 0,
        };
      });
      allUsers.push(...users);
    }

    // Text search on fullName
    if (query) {
      allUsers = prefixFilter(allUsers, 'fullName', query);
    }

    const found = allUsers.length;
    const startIdx = (currentPage - 1) * rowsPerPage;
    const paginatedResults = allUsers.slice(startIdx, startIdx + rowsPerPage);

    res
      .status(200)
      .json(formatSearchResponse(paginatedResults, found, currentPage));
  } catch (err) {
    console.error('Error performing search:', err);
    res.status(500).json({ error: 'Error performing search' });
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const pipe = withPipe(
    withCsrf(),
    withMethodsGuard(SUPPORTED_HTTP_METHODS),
    onHandler,
  );

  return withExceptionFilter(req, res)(pipe);
}
