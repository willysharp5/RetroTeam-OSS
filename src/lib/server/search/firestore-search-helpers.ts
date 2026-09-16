import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';
import type { Query } from 'firebase-admin/firestore';

/**
 * Formats a Firestore query result into the same shape Typesense returns,
 * so frontend hooks and components need zero changes.
 */
export function formatSearchResponse(
  docs: FirebaseFirestore.DocumentData[],
  found: number,
  page: number,
) {
  return {
    hits: docs.map((doc) => ({ document: doc })),
    found,
    page,
  };
}

/**
 * Applies offset-based pagination to a Firestore query.
 * Firestore doesn't support numeric offsets natively, so we use .offset()
 * from the Admin SDK (not available in client SDK).
 */
export async function paginateQuery(
  baseQuery: Query,
  page: number,
  perPage: number,
) {
  const offset = (page - 1) * perPage;
  const paginated = baseQuery.offset(offset).limit(perPage);
  return paginated;
}

/**
 * Runs a count aggregation on a Firestore query.
 */
export async function countQuery(baseQuery: Query): Promise<number> {
  const snapshot = await baseQuery.count().get();
  return snapshot.data().count;
}

/**
 * Returns the start-of-day and end-of-day timestamps in UTC milliseconds.
 */
export function getDateRangeUTC(startDate: number, endDate: number) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const startOfRange = Date.UTC(
    start.getUTCFullYear(),
    start.getUTCMonth(),
    start.getUTCDate(),
  );

  const endOfRange = Date.UTC(
    end.getUTCFullYear(),
    end.getUTCMonth(),
    end.getUTCDate(),
    23,
    59,
    59,
    999,
  );

  return { startOfRange, endOfRange };
}

/**
 * Filters an array of documents by prefix-matching a string field.
 * Used for name/text search since Firestore doesn't support substring search.
 */
export function prefixFilter<T extends Record<string, any>>(
  docs: T[],
  field: string,
  query: string,
): T[] {
  if (!query) return docs;
  const lower = query.toLowerCase();
  return docs.filter((doc) => {
    const value = doc[field];
    return typeof value === 'string' && value.toLowerCase().includes(lower);
  });
}
