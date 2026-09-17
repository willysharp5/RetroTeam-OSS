/**
 * @name DocsLink
 * @description One entry in the help menu — the question-mark dropdown in the
 * app header and the links at the bottom of the mobile menu.
 */
export interface DocsLink {
  title: string;
  link: string;
  order: number;
}

const REPOSITORY = 'https://github.com/willysharp5/RetroTeam-OSS';

/**
 * @name DEFAULT_DOCS
 * @description The help links shown in every screen's header.
 *
 * These live in code rather than in Firestore. The hosted commercial build read
 * them from a top-level `docs` collection that was populated by hand, so on a
 * self-hosted install the collection did not exist *and* had no security rule —
 * which made the read fail with `permission-denied: No matching allow
 * statements` rather than simply come back empty. The header renders on the
 * board, the icebreaker and every other signed-in screen, so that one denial
 * took down all of them.
 *
 * A self-hoster who wants their own links can create the `docs` collection and
 * give each document a `title`, a `link` and a numeric `order`; anything found
 * there replaces this list. See `useFetchDocs`.
 */
export const DEFAULT_DOCS: DocsLink[] = [
  { title: 'Documentation', link: `${REPOSITORY}#readme`, order: 1 },
  { title: 'Setup guide', link: `${REPOSITORY}#setup`, order: 2 },
  { title: 'Report an issue', link: `${REPOSITORY}/issues`, order: 3 },
];

/**
 * @name readDocsDocuments
 * @description Keep only the documents that have the two fields the menu
 * actually renders, so a half-filled document cannot produce a link to
 * `undefined`. Sorted here rather than by the query: ordering in Firestore
 * would drop any document missing `order`.
 */
export function readDocsDocuments(
  documents: Array<Partial<DocsLink>>,
): DocsLink[] {
  return documents
    .filter(
      (document): document is DocsLink =>
        typeof document.title === 'string' &&
        document.title.length > 0 &&
        typeof document.link === 'string' &&
        document.link.length > 0,
    )
    .sort((left, right) => (left.order ?? 0) - (right.order ?? 0));
}
