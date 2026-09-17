import { useEffect, useState } from 'react';
import { useFirestore } from 'reactfire';
import { collection, getDocs } from 'firebase/firestore';
import { TAGS_COLLECTION } from '~/lib/firestore-collections';
import { Tag } from '~/lib/board/types/types';

import { DEFAULT_TAGS } from './default-tags';

/**
 * @name TagsDocument
 * @description The shape of a document in the `tags` collection: one array of
 * tags per document.
 */
export interface TagsDocument {
  tags: Tag[];
}

/**
 * @name useFetchRetroTeamTags
 * @description The tags suggested when labelling a group on a board.
 *
 * Starts from `DEFAULT_TAGS` so the suggestions are there on a fresh install
 * with nothing seeded. If the `tags` collection holds any tags they replace
 * the built-in list wholesale, so a self-hoster gets exactly the vocabulary
 * they seeded rather than theirs plus twenty of ours.
 *
 * `data` is always an array. It used to be `null` until the fetch resolved and
 * stayed `null` when the fetch failed, and the board does not check: a group
 * with tags reaches `retroTeamTags.filter(...)` in `GroupCard` and throws on
 * null. It also used to read `tagData[0].tags` with no documents to read, which
 * threw `Cannot read properties of undefined (reading 'tags')` on every fresh
 * install and left the error in the console for the board to trip over later.
 */
function useFetchRetroTeamTags() {
  const firestore = useFirestore();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Tag[]>(DEFAULT_TAGS);
  const [error, setError] = useState<any | null>(null);

  useEffect(() => {
    let stale = false;

    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(
          collection(firestore, TAGS_COLLECTION),
        );

        if (stale) {
          return;
        }

        const seededTags = readTagDocuments(
          querySnapshot.docs.map((doc) => doc.data() as Partial<TagsDocument>),
        );

        // an empty collection is the normal case, and means "use the built-ins"
        if (seededTags.length) {
          setData(seededTags);
        }
      } catch (error) {
        console.error('Error fetching tags:', error);

        if (!stale) {
          // the built-in tags are already in state, so the board still works
          setError(error);
        }
      } finally {
        if (!stale) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      stale = true;
    };
  }, [firestore]);

  return { loading, data, error };
}

/**
 * @name readTagDocuments
 * @description Flatten the `tags` collection into one list, dropping anything
 * unusable and de-duplicating by id.
 *
 * A tag with no id is given one derived from its name, because the board
 * matches tags by id when it moves them between a group and the suggestion
 * list — an undefined id there would make every tag look like every other.
 */
function readTagDocuments(documents: Partial<TagsDocument>[]) {
  const byId = new Map<string, Tag>();

  for (const document of documents) {
    if (!Array.isArray(document.tags)) {
      continue;
    }

    for (const tag of document.tags) {
      const name = typeof tag?.name === 'string' ? tag.name.trim() : '';

      if (!name) {
        continue;
      }

      const id = typeof tag?.id === 'string' && tag.id ? tag.id : slugify(name);

      byId.set(id, { id, name });
    }
  }

  return Array.from(byId.values());
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default useFetchRetroTeamTags;
