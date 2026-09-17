import { useEffect, useState } from 'react';
import { useFirestore } from 'reactfire';
import {
  collection,
  query,
  orderBy,
  where,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';

import { Comment } from '~/lib/board/types/types';

import { onListenerError } from '~/lib/firestore-listener-error';

function useFetchDemoComments(
  allowViewAllComments: boolean,
  author: string,
  selectedTab: number,
) {
  const firestore = useFirestore();
  const commentsCollectionPath = `demo/demo/comments`;
  const commentsCollectionRef = collection(firestore, commentsCollectionPath);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState<any | null>(null);
  const [allComments, setAllComments] = useState<Comment[] | null>([]);

  useEffect(() => {

    let isCurrentQuery = true;

    const allCommentsQuery = query(
      commentsCollectionRef,
      orderBy('created', 'desc')
    );

    const unsubscribeAll = onSnapshot(allCommentsQuery, async (querySnapshot) => {

      const allData = [];
      for (const docSnapshot of querySnapshot.docs) {
        const item = docSnapshot.data();
        allData.push({
          ...item,
          user: { name: '', lastName: '' }
        });
      }
      setAllComments(allData as Comment[]);

      fetchFilteredComments();
    },
      onListenerError('get-demo-comments', { setError, setLoading }),
    );

    const getFilteredQuery = () => {
      if (!isCurrentQuery) return null;

      if (selectedTab === 4) {
        return query(
          commentsCollectionRef,
          orderBy('votes', 'desc'),
          orderBy('created', 'desc'),
          where('group', '==', '')
        );
      }

      if (allowViewAllComments || selectedTab > 1) {
        return query(
          commentsCollectionRef,
          orderBy('order'),
          orderBy('created', 'desc'),
          where('group', '==', '')
        );
      }

      if (selectedTab === 1 && !allowViewAllComments && author) {
        return query(
          commentsCollectionRef,
          orderBy('order'),
          orderBy('created', 'desc'),
          where('group', '==', ''),
          where('author', '==', author)
        );
      }

      return null;
    };

    const fetchFilteredComments = async () => {
      const filteredCommentsQuery = getFilteredQuery();
      if (!filteredCommentsQuery) return;

      try {
        const querySnapshot = await getDocs(filteredCommentsQuery);
        const filteredData = [];
        for (const docSnapshot of querySnapshot.docs) {
          const item = docSnapshot.data();
          filteredData.push({
            ...item,
            user: { name: '', lastName: '' },
          });
        }

        setData(filteredData as any);

      } catch (error: any) {
        if (isCurrentQuery) {
          console.error('Error fetching filtered comments:', error);
          setError(error);
        }
      } finally {
        if (isCurrentQuery) setLoading(false);
      }
    };


    return () => {
      isCurrentQuery = false;
      unsubscribeAll();
    };
  }, [
    firestore,
    allowViewAllComments,
    selectedTab,
    author,
  ]);

  return { data, loading, error, allComments };
}

export default useFetchDemoComments;
