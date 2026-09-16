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
  organizationFilter: z.string().optional(),
  teamFilter: z.string().optional(),
  status: z.string().optional(),
  archive: z.string().optional(),
  startDate: z.number().optional(),
  endDate: z.number().optional(),
  selectedUsersIds: z.array(z.any()).optional(),
  boardFilter: z.array(z.string()).optional(),
  selectedDueDates: z.array(z.string()).optional(),
  rowsPerPage: z.number().optional(),
  currentPage: z.number().optional(),
  isOnlyOrganization: z.boolean().optional(),
  myBoardsId: z.array(z.string()).optional(),
});

const SUPPORTED_HTTP_METHODS: HttpMethod[] = ['POST'];

async function onHandler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await initializeFirebaseAdminApp();
    const firestore = getRestFirestore();

    const {
      query,
      organizationFilter,
      teamFilter,
      status,
      archive,
      startDate,
      endDate,
      selectedUsersIds,
      boardFilter,
      selectedDueDates,
      rowsPerPage = 10,
      currentPage = 1,
      isOnlyOrganization,
      myBoardsId,
    } = await Body.parseAsync(req.body);

    if (!organizationFilter) {
      return res.status(400).json({ error: 'organizationFilter is required' });
    }

    // Actions can live in two places:
    // - Organization-level team actions: organizations/{orgId}/teams/{teamId}/actions
    // - Board actions: organizations/{orgId}/board/{boardId}/actions
    // The Typesense index flattened them all. We query the collectionGroup 'actions'
    // scoped under the organization to get all actions at once.

    // We'll use a collection group query to find all 'actions' under this org
    // But Firestore collection group queries can't be scoped to a parent path,
    // so we fetch and filter by organization field.

    let allResults: any[] = [];

    const mapActionDoc = (doc: FirebaseFirestore.DocumentSnapshot, defaultTeam: string, defaultRetro?: string) => {
      const data = doc.data() || {};
      return {
        id: doc.id,
        assignee: data.assignee || '',
        author: data.author || '',
        archive: data.archive || false,
        created: data.created?.toMillis ? data.created.toMillis() : data.created || 0,
        date: data.date?.toMillis ? data.date.toMillis() : (data.date || 0),
        description: data.description || '',
        order: data.order || 0,
        organization: organizationFilter,
        status: data.status || '',
        team: defaultTeam,
        retrospective: defaultRetro ?? data.retrospective ?? 'empty',
        jiraURl: data.jiraURl || '',
      };
    };

    if (teamFilter) {
      const teamActionsRef = firestore
        .collection('organizations')
        .doc(organizationFilter)
        .collection('teams')
        .doc(teamFilter)
        .collection('actions');

      const snapshot = await teamActionsRef.get();
      allResults.push(...snapshot.docs.map((doc) => mapActionDoc(doc, teamFilter)));
    }

    if (boardFilter && boardFilter.length > 0) {
      for (const boardId of boardFilter) {
        const boardActionsRef = firestore
          .collection('organizations')
          .doc(organizationFilter)
          .collection('board')
          .doc(boardId)
          .collection('actions');

        const snapshot = await boardActionsRef.get();
        allResults.push(...snapshot.docs.map((doc) => mapActionDoc(doc, doc.data()?.team || '', boardId)));
      }
    } else if (!teamFilter) {
      const teamsSnap = await firestore
        .collection('organizations')
        .doc(organizationFilter)
        .collection('teams')
        .get();

      for (const teamDoc of teamsSnap.docs) {
        const snapshot = await teamDoc.ref.collection('actions').get();
        allResults.push(...snapshot.docs.map((doc) => mapActionDoc(doc, teamDoc.id)));
      }
    }

    // In-memory: status filter
    if (status) {
      allResults = allResults.filter((a) => a.status === status);
    }

    // In-memory: archive filter
    if (archive === 'archive') {
      allResults = allResults.filter((a) => a.archive === true);
    } else {
      allResults = allResults.filter((a) => a.archive !== true);
    }

    // Organization-only actions (no retrospective)
    if (isOnlyOrganization) {
      allResults = allResults.filter(
        (a) => !a.retrospective || a.retrospective === 'empty',
      );
    }

    // Board scope filter using myBoardsId
    if (!isOnlyOrganization && !boardFilter?.length && myBoardsId && myBoardsId.length > 0) {
      allResults = allResults.filter(
        (a) =>
          !a.retrospective ||
          a.retrospective === 'empty' ||
          myBoardsId.includes(a.retrospective),
      );
    }

    // Assignee filter
    if (selectedUsersIds && selectedUsersIds.length > 0) {
      allResults = allResults.filter((a) =>
        selectedUsersIds.includes(a.assignee),
      );
    }

    // Date range filter
    if (startDate && endDate) {
      const { startOfRange, endOfRange } = getDateRangeUTC(startDate, endDate);
      allResults = allResults.filter(
        (a) => a.date >= startOfRange && a.date <= endOfRange,
      );
    }

    // Due date filters
    if (selectedDueDates && selectedDueDates.length > 0) {
      const now = Date.now();
      allResults = allResults.filter((a) => {
        if (selectedDueDates.includes('No Due Date') && (!a.date || a.date === 0)) return true;
        if (selectedDueDates.includes('Overdue') && a.date && a.date !== 0 && a.date < now) return true;
        if (selectedDueDates.includes('Due Date') && a.date && a.date !== 0) return true;
        return false;
      });
    }

    // Text search on description
    if (query) {
      allResults = prefixFilter(allResults, 'description', query);
    }

    // Sort by created desc
    allResults.sort((a, b) => (b.created || 0) - (a.created || 0));

    const found = allResults.length;
    const startIdx = (currentPage - 1) * rowsPerPage;
    const paginatedResults = allResults.slice(startIdx, startIdx + rowsPerPage);

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
