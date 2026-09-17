import { useEffect, useState } from 'react';
import { useFirestore } from 'reactfire';
import {
  collection,
  query,
  orderBy,
  where,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
} from 'firebase/firestore';
import { USERS_COLLECTION } from '~/lib/firestore-collections';
import { Comment } from '~/lib/board/types/types';

import { onListenerError } from '~/lib/firestore-listener-error';

function useFetchComments(
  organization: string,
  teamId: string,
  retrospectiveId: string,
  allowViewAllComments: boolean,
  currentUserRole: number,
  author: string,
  selectedTab: number,
) {
  const firestore = useFirestore();
  const commentsCollectionPath = `organizations/${organization}/board/${retrospectiveId}/comments`;
  const commentsCollectionRef = collection(firestore, commentsCollectionPath);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState<any | null>(null);
  const [allComments, setAllComments] = useState<Comment[] | null>([]);

  const getCommentById = async (id: string) => {
    if (id) {
      try {
        const userRef = doc(firestore, USERS_COLLECTION, id);
        const userDoc = await getDoc(userRef);
        return userDoc.exists() ? userDoc.data() : null;
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }
    return null;
  };

  useEffect(() => {
    if (!organization || !teamId || !retrospectiveId) return;

    let isCurrentQuery = true;

    const allCommentsQuery = query(
      commentsCollectionRef,
      orderBy('created', 'desc')
    );

    const unsubscribeAll = onSnapshot(allCommentsQuery, async (querySnapshot) => {

      const allData = [];
      for (const docSnapshot of querySnapshot.docs) {
        const item = docSnapshot.data();
        const user = await getCommentById(item.author);
        allData.push({
          ...item,
          user: user ? { ...user, id: item.author } : { name: '', lastName: '' },
        });
      }
      setAllComments(allData as Comment[]);
      
    fetchFilteredComments();
    },
      onListenerError('get-comments', { setError, setLoading }),
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
          const user = await getCommentById(item.author);
          filteredData.push({
            ...item,
            user: user ? { ...user, id: item.author } : { name: '', lastName: '' },
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
    organization,
    teamId,
    retrospectiveId,
    allowViewAllComments,
    selectedTab,
    author,
  ]);

  return { data, loading, error, allComments };
}

export default useFetchComments;
