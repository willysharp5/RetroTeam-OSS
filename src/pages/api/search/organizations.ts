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

const Body = z.object({
  query: z.string(),
  nameFilter: z.string().optional(),
  startDate: z.any().optional(),
  endDate: z.any().optional(),
  rowsPerPage: z.number().optional(),
  currentPage: z.number().optional(),
  nameSort: z.string().optional(),
  createdSort: z.string().optional(),
  sortTeam: z.string().optional(),
  sortMember: z.string().optional(),
});

const SUPPORTED_HTTP_METHODS: HttpMethod[] = ['POST'];

async function onHandler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await initializeFirebaseAdminApp();
    const firestore = getRestFirestore();

    const {
      query,
      nameFilter,
      startDate,
      endDate,
      rowsPerPage = 10,
      currentPage = 1,
      nameSort,
      createdSort,
      sortTeam,
      sortMember,
    } = await Body.parseAsync(req.body);

    const orgsRef = firestore.collection('organizations');

    // Determine sort
    let sortField = 'createdAt';
    let sortDir: 'asc' | 'desc' = 'desc';

    if (nameSort && nameSort !== 'none') {
      sortField = 'searchableName';
      sortDir = nameSort as 'asc' | 'desc';
    } else if (sortTeam && sortTeam !== 'none') {
      sortField = 'teams';
      sortDir = sortTeam as 'asc' | 'desc';
    } else if (sortMember && sortMember !== 'none') {
      sortField = 'members';
      sortDir = sortMember as 'asc' | 'desc';
    } else if (createdSort && createdSort !== 'none') {
      sortField = 'createdAt';
      sortDir = createdSort as 'asc' | 'desc';
    }

    const snapshot = await orgsRef.get();

    let results = snapshot.docs.map((doc) => {
      const data = doc.data();
      const membersVal = data.members;
      const teamsVal = data.teams;
      return {
        id: doc.id,
        name: data.name || '',
        searchableName: data.searchableName || (data.name || '').toLowerCase(),
        createdAt: data.createdAt || 0,
        teams: typeof teamsVal === 'number' ? teamsVal : (teamsVal && typeof teamsVal === 'object' ? Object.keys(teamsVal).length : 0),
        members: typeof membersVal === 'number' ? membersVal : (membersVal && typeof membersVal === 'object' ? Object.keys(membersVal).length : 0),
        logoURL: data.logoURL || '',
      };
    });

    // In-memory: date range filter
    if (startDate && endDate) {
      results = results.filter(
        (r) => r.createdAt >= startDate && r.createdAt <= endDate,
      );
    }

    // Text filters
    if (nameFilter) {
      results = prefixFilter(results, 'name', nameFilter);
    }

    if (query) {
      results = prefixFilter(results, 'searchableName', query);
    }

    // In-memory sort
    results.sort((a: any, b: any) => {
      const aVal = a[sortField] ?? '';
      const bVal = b[sortField] ?? '';
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    const found = results.length;
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
