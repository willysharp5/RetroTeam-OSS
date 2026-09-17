import { useCallback, useEffect, useMemo, useState } from 'react';

import { Templates } from '../types/templates';
import { DEFAULT_TEMPLATES } from '../default-templates';

/**
 * @name useGetTemplates
 * @description Returns the built-in retrospective templates, one page at a
 * time.
 *
 * The templates are defined in code (see `DEFAULT_TEMPLATES`) rather than read
 * from Firestore. The hosted commercial build kept them in a `templates`
 * collection that was populated by hand, so a self-hosted install started with
 * an empty picker and could not create a retrospective. Reading them from code
 * means they are always present, with nothing to seed and no read cost.
 *
 * Pagination is kept because the picker renders a pager, but it is now a slice
 * of an in-memory array, so `fetchTemplates` is synchronous in effect and can
 * never fail.
 */
export function useGetTemplates(pageSize: number = 4) {
  const [currentPage, setCurrentPage] = useState<number>(1);

  const templates = DEFAULT_TEMPLATES;

  const totalTemplates = templates.length;

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalTemplates / pageSize)),
    [totalTemplates, pageSize],
  );

  const templateData: Templates[] = useMemo(() => {
    const start = (currentPage - 1) * pageSize;

    return templates.slice(start, start + pageSize);
  }, [templates, currentPage, pageSize]);

  const fetchTemplates = useCallback(
    async (page: number) => {
      // clamp, so a stale pager click can never land on an empty page
      const nextPage = Math.min(Math.max(1, page), totalPages);

      setCurrentPage(nextPage);
    },
    [totalPages],
  );

  // when the page size changes the current page may no longer exist
  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  return {
    templateData,
    fetchTemplates,
    currentPage,
    totalPages,
    totalTemplates,
  };
}
