import { collection, getDocs } from 'firebase/firestore';
import { useFirestore } from 'reactfire';
import { ICEBREAKERS_COLLECTION } from '~/lib/firestore-collections';
import { Icebreakers } from '../types/icebreakers';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  DEFAULT_ICEBREAKERS,
  DEFAULT_ICEBREAKER_COLORS,
  FALLBACK_ICEBREAKER_COLOR,
} from '../defaults';

interface Category {
  color: string;
  category: string;
}

/**
 * @name useIcebreakers
 * @description The icebreaker categories and their questions.
 *
 * Starts from the questions defined in code (see `DEFAULT_ICEBREAKERS`) so the
 * feature works on a fresh install with nothing seeded, then overlays whatever
 * the `icebreakers` collection holds: a category defined there is added, and
 * one that shares a key replaces the built-in questions for it.
 *
 * The previous version read `docs[0]` for the questions and `docs[1]` for the
 * colours. That assumed the collection held exactly two documents in a fixed
 * order — `getDocs` makes no such promise — and on an empty collection it threw
 * `Cannot read properties of undefined (reading 'data')`, which the surrounding
 * `catch` logged and swallowed, leaving the screen blank with no categories.
 * Documents are now told apart by the shape of their values rather than by
 * position, so the two may arrive in either order, be named anything, or be
 * merged into one.
 */
export function useIcebreakers() {
  const firestore = useFirestore();

  const [icebreakers, setIcebreakers] =
    useState<Icebreakers>(DEFAULT_ICEBREAKERS);

  const [colors, setColors] = useState<Record<string, string>>(
    DEFAULT_ICEBREAKER_COLORS,
  );

  const [category, setCategory] = useState<string>(
    () => Object.keys(DEFAULT_ICEBREAKERS)[0] ?? '',
  );

  useEffect(() => {
    let stale = false;

    async function fetchIcebreakers() {
      try {
        const snapshot = await getDocs(
          collection(firestore, ICEBREAKERS_COLLECTION),
        );

        // nothing to overlay: the built-in questions stand on their own
        if (stale || snapshot.empty) {
          return;
        }

        const { questions, categoryColors } = readIcebreakerDocuments(
          snapshot.docs.map((doc) => doc.data()),
        );

        const mergedIcebreakers = { ...DEFAULT_ICEBREAKERS, ...questions };

        setIcebreakers(mergedIcebreakers);
        setColors({ ...DEFAULT_ICEBREAKER_COLORS, ...categoryColors });
        setCategory(Object.keys(mergedIcebreakers)[0] ?? '');
      } catch (error) {
        // The built-in questions are already in state, so the screen stays
        // usable. Worth a line either way: on a self-hosted install this is
        // where a missing Firestore rule for `icebreakers` would show up.
        console.error('Error getting the icebreakers:', error);
      }
    }

    fetchIcebreakers();

    return () => {
      stale = true;
    };
  }, [firestore]);

  const categories: Category[] = useMemo(
    () =>
      Object.keys(icebreakers).map((name) => ({
        category: name,
        color: colors[name] ?? FALLBACK_ICEBREAKER_COLOR,
      })),
    [icebreakers, colors],
  );

  const getRandomIcebreaker = useCallback(
    (category: string) => {
      if (category === '') {
        return null;
      }

      const icebreakerList = icebreakers[category] || [];

      if (icebreakerList.length === 0) {
        return null;
      }

      const randomIndex = Math.floor(Math.random() * icebreakerList.length);

      return icebreakerList[randomIndex];
    },
    [icebreakers],
  );

  const changeCategory = useCallback((newCategory: string) => {
    setCategory(newCategory);
  }, []);

  return { getRandomIcebreaker, changeCategory, categories, category };
}

/**
 * @name readIcebreakerDocuments
 * @description Split the documents of the `icebreakers` collection into
 * questions and colours.
 *
 * Both documents are maps keyed by category name; what tells them apart is the
 * value. Questions are an array of strings, a colour is a single string. Going
 * by shape rather than by document position or id means the collection can hold
 * the two documents in either order, under any name, or fold both into one.
 * Anything else is ignored rather than allowed to become a broken category.
 */
function readIcebreakerDocuments(documents: Record<string, unknown>[]) {
  const questions: Icebreakers = {};
  const categoryColors: Record<string, string> = {};

  for (const document of documents) {
    for (const [name, value] of Object.entries(document)) {
      if (Array.isArray(value)) {
        const strings = value.filter(
          (item): item is string => typeof item === 'string',
        );

        // a category with no usable question would render as an empty tab
        if (strings.length) {
          questions[name] = strings;
        }
      } else if (typeof value === 'string' && value !== '') {
        categoryColors[name] = value;
      }
    }
  }

  return { questions, categoryColors };
}
