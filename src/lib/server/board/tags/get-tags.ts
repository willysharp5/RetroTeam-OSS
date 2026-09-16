import { useEffect, useState } from 'react';
import { useFirestore } from 'reactfire';
import { collection, getDocs } from 'firebase/firestore';
import { TAGS_COLLECTION } from '~/lib/firestore-collections';

export interface Tag {
  tags: [
    {
      name: string;
    },
  ];
}

function useFetchRetroTeamTags() {
  const firestore = useFirestore();
  const tagsRef = collection(firestore, TAGS_COLLECTION);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(<any | null>null);
  const [error, setError] = useState<any | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(tagsRef);
        const tagData: Tag[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data() as Tag;
          tagData.push(data);
        });

        const tagsArray = tagData[0].tags;
        setData(tagsArray);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching tags:', error);
        setError(error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { loading, data, error };
}

export default useFetchRetroTeamTags;
