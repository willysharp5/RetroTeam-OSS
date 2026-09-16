import { collection, getDocs } from 'firebase/firestore';
import { useFirestore } from 'reactfire';
import { ICEBREAKERS_COLLECTION } from '~/lib/firestore-collections';
import { Icebreakers } from '../types/icebreakers';
import { useCallback, useEffect, useState } from 'react';

interface Category {
  color: string;
  category: string;
}
export function useIcebreakers() {
  const firestore = useFirestore();
  const icebreakersCollection = collection(firestore, ICEBREAKERS_COLLECTION);
  const [icebreakers, setIcebreakers] = useState<Icebreakers>({});
  const [category, setCategory] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    async function fetchIcebreakers() {
      try {
        const querySnapshot = await getDocs(icebreakersCollection);
        let fetchedIcebreakers: Icebreakers = {};
        let fetchedCategories: string[] = [];

        const data = querySnapshot.docs[0].data();
        const colors = querySnapshot.docs[1].data();

        const mergedData = [] as any;

        for (const category in data) {
          if (colors.hasOwnProperty(category)) {
            mergedData.push({
              category: category,
              color: colors[category],
            });
          } else {
            mergedData.push({
              category: category,
              color: null,
            });
          }
        }

        const icebreakerCategories = Object.keys(data);
        fetchedIcebreakers = data;
        fetchedCategories.push(...icebreakerCategories);

        setIcebreakers(fetchedIcebreakers);
        setCategories(mergedData);
        setCategory(fetchedCategories[0]);
      } catch (error) {
        console.error('Error getting the icebreakers:', error);
      }
    }

    fetchIcebreakers();
  }, []);

  const getRandomIcebreaker = useCallback((category: string) => {
    if (category === '') {
      return null;
    }

    const icebreakerList = icebreakers[category] || [];

    if (icebreakerList.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * icebreakerList.length);
    return icebreakerList[randomIndex];
  }, [icebreakers]);

  const changeCategory = useCallback((newCategory: string) => {
    setCategory(newCategory);
  }, []);

  return { getRandomIcebreaker, changeCategory, categories, category };
}
