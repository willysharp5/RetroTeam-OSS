import {
  collection,
  doc,
  onSnapshot,
} from 'firebase/firestore';

import { useCallback, useState, useEffect } from 'react';
import { useFirestore } from 'reactfire';

import { Retrospectives } from '~/lib/retrospectives/types/retrospectives';

import { onListenerError } from '~/lib/firestore-listener-error';


export function useGetDemoRetrospective(

) {
  const firestore = useFirestore();

  const demoCollectionPath = `demo`;
  const demoCollection = collection(firestore, demoCollectionPath);

  const [retrospective, setRetrospective] = useState<Retrospectives | any>();

  const [boardMembers, setMembers] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null | any>(null);
  const [requestedUser, setRequestedUser] = useState<any>(null);

  const fetchBoard = useCallback(async () => {
    try {
      setLoading(true);
      const boardRef = doc(demoCollection, 'demo');

      // Set up a real-time listener for the board Collection
      const unsubscribeBoard = onSnapshot(boardRef, async (querySnapshot) => {
        const boardData = querySnapshot.data();
        setRetrospective(boardData);

      },
        onListenerError('get-demo-retrospective', { setError, setLoading }),
      );

      // Clean up listeners when no longer needed
      return () => {
        unsubscribeBoard();
      };
    } catch (error: any) {
      console.error('Error fetching retrospectives:', error);
      setRetrospective([]);
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [demoCollection]);


  useEffect(() => {
    // Fetch board when the component mounts or when organizationId / retrospectiveId changes

    fetchBoard();

  }, []);

  return {
    retrospective,
    loading,
    error,
    fetchBoard,
    requestedUser,
    members: boardMembers,
  };
}
