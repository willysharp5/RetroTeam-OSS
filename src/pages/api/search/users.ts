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
  emailFilter: z.string(),
  idFilter: z.string().optional(),
  statusFilter: z.number().optional(),
  startDate: z.any().optional(),
  endDate: z.any().optional(),
  rowsPerPage: z.number().optional(),
  currentPage: z.number().optional(),
  nameSort: z.string().optional(),
  emailSort: z.string().optional(),
  createdSort: z.string().optional(),
  loginSort: z.string().optional(),
});

const SUPPORTED_HTTP_METHODS: HttpMethod[] = ['POST'];

async function onHandler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await initializeFirebaseAdminApp();
    const firestore = getRestFirestore();

    const {
      query,
      nameFilter,
      emailFilter,
      idFilter,
      statusFilter,
      startDate,
      endDate,
      rowsPerPage = 10,
      currentPage = 1,
      nameSort,
      emailSort,
      createdSort,
      loginSort,
    } = await Body.parseAsync(req.body);

    const usersRef = firestore.collection('users');

    // Determine the sort field and direction
    let sortField = 'createdAt';
    let sortDir: 'asc' | 'desc' = 'desc';

    if (nameSort && nameSort !== 'none') {
      sortField = 'searchableName';
      sortDir = nameSort as 'asc' | 'desc';
    } else if (emailSort && emailSort !== 'none') {
      sortField = 'email';
      sortDir = emailSort as 'asc' | 'desc';
    } else if (createdSort && createdSort !== 'none') {
      sortField = 'createdAt';
      sortDir = createdSort as 'asc' | 'desc';
    } else if (loginSort && loginSort !== 'none') {
      sortField = 'lastLoginAt';
      sortDir = loginSort as 'asc' | 'desc';
    }

    const mapUserDoc = (doc: FirebaseFirestore.DocumentSnapshot) => {
      const data = doc.data() || {};
      return {
        id: doc.id,
        uid: doc.id,
        name: data.name || '',
        lastName: data.lastName || '',
        fullName: data.fullName || '',
        displayName: data.displayName || data.fullName || '',
        searchableName: data.searchableName || (data.fullName || '').toLowerCase(),
        email: data.email || '',
        disabled: data.disabled || false,
        created: data.createdAt || 0,
        createdAt: data.createdAt || 0,
        lastLoginAt: data.lastLoginAt || 0,
        photoUrl: data.photoUrl || data.photoURL || '',
        phoneNumber: data.phoneNumber || '',
      };
    };

    // Filter by specific user ID
    if (idFilter) {
      const doc = await usersRef.doc(idFilter).get();
      if (doc.exists) {
        return res.status(200).json(formatSearchResponse([mapUserDoc(doc)], 1, 1));
      }
      return res.status(200).json(formatSearchResponse([], 0, 1));
    }

    const snapshot = await usersRef.get();

    let results = snapshot.docs.map(mapUserDoc);

    // In-memory: disabled status filter
    if (statusFilter === 1) {
      results = results.filter((r) => !r.disabled);
    } else if (statusFilter === 2) {
      results = results.filter((r) => r.disabled);
    }

    // In-memory: date range on createdAt
    if (startDate && endDate) {
      results = results.filter(
        (r) => r.createdAt >= startDate && r.createdAt <= endDate,
      );
    }

    // In-memory text filters
    if (nameFilter) {
      results = prefixFilter(results, 'fullName', nameFilter);
    }

    if (emailFilter) {
      results = prefixFilter(results, 'email', emailFilter);
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
