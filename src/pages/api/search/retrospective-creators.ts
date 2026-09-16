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
  currentPage: z.number(),
  rowsPerPage: z.number(),
});

async function onHandler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await initializeFirebaseAdminApp();
    const firestore = getRestFirestore();

    const { query, organizationFilter, currentPage, rowsPerPage } =
      await Body.parseAsync(req.body);

    // The "retrospective owners/creators" collection in Typesense was a
    // denormalized list of users who created retrospectives in the org.
    // We replicate this by querying all retrospectives in the org,
    // collecting unique createdBy IDs, then fetching those user documents.

    const retrospectivesRef = firestore
      .collection('organizations')
      .doc(organizationFilter)
      .collection('retrospectives');

    const retrosSnapshot = await retrospectivesRef.select('createdBy').get();

    const creatorCounts = new Map<string, number>();
    retrosSnapshot.docs.forEach((doc) => {
      const createdBy = doc.data().createdBy;
      if (createdBy) {
        creatorCounts.set(createdBy, (creatorCounts.get(createdBy) || 0) + 1);
      }
    });

    if (creatorCounts.size === 0) {
      return res.status(200).json(formatSearchResponse([], 0, currentPage));
    }

    const creatorIdsArray = Array.from(creatorCounts.keys());
    const batchSize = 10;
    let allUsers: any[] = [];

    for (let i = 0; i < creatorIdsArray.length; i += batchSize) {
      const batch = creatorIdsArray
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
          retrospectivesCount: creatorCounts.get(doc.id) || 0,
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
