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
  getDateRangeUTC,
  prefixFilter,
} from '~/lib/server/search/firestore-search-helpers';

const Body = z.object({
  query: z.string(),
  nameFilter: z.string().optional(),
  typeFilter: z.string().optional(),
  teamFilter: z.array(z.string()).optional(),
  organizationFilter: z.string().optional(),
  selectedBoards: z.array(z.any()).optional(),
  selectedUsersIds: z.array(z.any()).optional(),
  userId: z.string(),
  teamId: z.string(),
  startDate: z.number().optional(),
  endDate: z.number().optional(),
  rowsPerPage: z.number(),
  currentPage: z.number(),
});

const SUPPORTED_HTTP_METHODS: HttpMethod[] = ['POST'];

async function onHandler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await initializeFirebaseAdminApp();
    const firestore = getRestFirestore();

    const {
      query,
      typeFilter,
      organizationFilter,
      teamFilter,
      selectedBoards,
      selectedUsersIds,
      userId,
      teamId,
      startDate,
      endDate,
      rowsPerPage,
      currentPage,
    } = await Body.parseAsync(req.body);

    if (!organizationFilter) {
      return res.status(400).json({ error: 'organizationFilter is required' });
    }

    const retrospectivesRef = firestore
      .collection('organizations')
      .doc(organizationFilter)
      .collection('retrospectives');

    // Fetch all retrospectives for this org, then filter in memory.
    // This avoids requiring composite indexes that may not be deployed yet,
    // and handles documents that may not have all fields set.
    const snapshot = await retrospectivesRef.get();

    // Board filter logic
    let filterByCreatedBy: string | null = null;
    let excludeCreatedBy: string | null = null;
    let filterByTeam = false;
    let showArchived = false;

    if (selectedBoards && selectedBoards.length > 0) {
      const boardTypes = selectedBoards.reduce(
        (acc: Record<string, boolean>, item: any) => {
          acc[item.id] = true;
          return acc;
        },
        {},
      );

      const hasMyBoards = boardTypes['myboards'];
      const hasSharedBoards = boardTypes['shared'];

      if (hasSharedBoards && !hasMyBoards) {
        excludeCreatedBy = userId;
      } else if (hasMyBoards && !hasSharedBoards) {
        filterByCreatedBy = userId;
      }

      if (boardTypes['team']) {
        filterByTeam = true;
      }

      showArchived = boardTypes['archives'] ?? false;
    }

    let results = snapshot.docs.map((doc) => {
      const data = doc.data();
      const dateVal = data.date?.toMillis ? data.date.toMillis() : data.date;

      // Extract team ID from the Firestore reference
      let docTeamId = '';
      if (data.team && data.team._path) {
        const segments = data.team._path.segments;
        docTeamId = segments[segments.length - 1];
      } else if (typeof data.team === 'string') {
        docTeamId = data.team;
      }

      return {
        id: doc.id,
        title: data.title || '',
        name: data.name || '',
        team: docTeamId,
        organization: organizationFilter,
        date: dateVal,
        archived: data.archived || false,
        createdBy: data.createdBy || '',
        finished: data.finished || false,
        icebreaker: data.icebreaker || false,
        locked: data.locked || false,
        type: data.access?.type || '',
        members: data.members ? JSON.stringify(data.members) : '{}',
        actions: data.actions || 0,
      };
    });

    // In-memory: archived filter (treats missing archived as false)
    results = results.filter((r) => r.archived === showArchived);

    // In-memory: createdBy filter
    if (filterByCreatedBy) {
      results = results.filter((r) => r.createdBy === filterByCreatedBy);
    }

    // In-memory: exclude createdBy
    if (excludeCreatedBy) {
      results = results.filter((r) => r.createdBy !== excludeCreatedBy);
    }

    // In-memory: access type filter (public/private)
    if (typeFilter) {
      results = results.filter((r) => r.type === typeFilter);
    }

    // In-memory: date range filter
    if (startDate && endDate) {
      const { startOfRange, endOfRange } = getDateRangeUTC(startDate, endDate);
      results = results.filter(
        (r) => r.date && r.date >= startOfRange && r.date <= endOfRange,
      );
    }

    // In-memory: team board filter
    if (filterByTeam) {
      results = results.filter((r) => r.team === teamId);
    }

    // In-memory: multi-team filter
    if (teamFilter && teamFilter.length > 0) {
      results = results.filter((r) => teamFilter.includes(r.team));
    }

    // In-memory: creators filter
    if (selectedUsersIds && selectedUsersIds.length > 0) {
      results = results.filter((r) => selectedUsersIds.includes(r.createdBy));
    }

    // In-memory: text search on name
    if (query) {
      results = prefixFilter(results, 'name', query);
    }

    // Sort by date descending
    results.sort((a, b) => (b.date || 0) - (a.date || 0));

    const found = results.length;

    // Paginate
    const startIdx = (currentPage - 1) * rowsPerPage;
    const paginatedResults = results.slice(startIdx, startIdx + rowsPerPage);

    res.status(200).json(formatSearchResponse(paginatedResults, found, currentPage));
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
