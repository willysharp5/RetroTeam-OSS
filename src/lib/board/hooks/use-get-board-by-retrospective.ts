import { useCallback, useState, useEffect } from 'react';
import { useFirestore } from 'reactfire';

import {
  collection,
  getDoc,
  doc,
  getDocs,
  query,
  where,
  onSnapshot,
  DocumentSnapshot,
} from 'firebase/firestore';
import {
  BOARD_COLLECTION,
  ORGANIZATIONS_COLLECTION,
} from '~/lib/firestore-collections';
import { Retrospectives } from '~/lib/retrospectives/types/retrospectives';

import { RequestsBoard } from '../types/membership-role';

import { onListenerError } from '~/lib/firestore-listener-error';

export function useGetBoardByRetrospectiveId(
  organizationId: string,
  retrospectiveId: string,
) {
  const firestore = useFirestore();

  const boardCollectionPath = `${ORGANIZATIONS_COLLECTION}/${organizationId}/${BOARD_COLLECTION}`;
  const boardCollection = collection(firestore, boardCollectionPath);

  const [retrospective, setRetrospective] = useState<Retrospectives | any>();
  const [pendingRequests, setPendingRequests] = useState<RequestsBoard | any>(
    [],
  );
  const [requests, setRequests] = useState<RequestsBoard | any>([]);
  const [boardMembers, setMembers] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null | any>(null);
  const [requestedUser, setRequestedUser] = useState<any>(null);

  const fetchBoard = useCallback(async () => {
    try {
      setLoading(true);
      const boardRef = doc(boardCollection, retrospectiveId);

      // Held outside the board listener so it can be disposed: returning a
      // teardown from a snapshot callback does nothing, the SDK ignores it. Every
      // board update used to open another retrospective listener on top of the
      // last one, and none of them were ever closed.
      let unsubscribeRetrospective: (() => void) | undefined;

      // Set up a real-time listener for the board Collection
      const unsubscribeBoard = onSnapshot(boardRef, async (querySnapshot) => {
        const boardData = querySnapshot.data();

        if (boardData) {
          const retrospectiveRef = boardData.retrospectiveRef;

          unsubscribeRetrospective?.();

          // Listen for changes in retrospectiveRef
          unsubscribeRetrospective = onSnapshot(
            retrospectiveRef,
            async (retrospectiveSnapshot: DocumentSnapshot) => {
              const retrospectiveData = retrospectiveSnapshot.data();

              if (retrospectiveData) {
                const teamData = await getRefData(retrospectiveData.team);

                retrospectiveData.teamId = boardData.teamId;
                retrospectiveData.authors = boardData.authors;
                retrospectiveData.votes = boardData.votes;
                retrospectiveData.teamData = teamData;

                setRetrospective(retrospectiveData);
              }
            },
            onListenerError('use-get-board-by-retrospective', {
              setError,
              setLoading,
            }),
          );
        }
      },
        onListenerError('use-get-board-by-retrospective', {
          setError,
          setLoading,
        }),
      );

      // Clean up listeners when no longer needed
      return () => {
        unsubscribeRetrospective?.();
        unsubscribeBoard();
      };
    } catch (error: any) {
      console.error('Error fetching retrospectives:', error);
      setRetrospective([]);
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [boardCollection, retrospectiveId]);

  const fetchRequests = useCallback(() => {
    try {
      setLoading(true);

      const requestsCollectionPath = `${ORGANIZATIONS_COLLECTION}/${organizationId}/${BOARD_COLLECTION}/${retrospectiveId}/requests`;
      const requestsCollection = collection(firestore, requestsCollectionPath);

      // Set up a real-time listener for the requestsCollection
      const unsubscribe = onSnapshot(
        requestsCollection,
        async (querySnapshot) => {
          const requests = [] as any[];

          for (const doc of querySnapshot.docs) {
            const requestData = doc.data();
            const userData = await getRefData(requestData.userRef);

            if (userData) {
              requestData.userName = userData.fullName;
              requestData.email = userData.email;
            }

            requests.push(requestData);
          }
          // Update the state with the new data
          setRequests(requests);
        },
        onListenerError('use-get-board-by-retrospective', {
          setError,
          setLoading,
        }),
      );

      // Return the unsubscribe function to clean up the listener when needed
      return () => unsubscribe();
    } catch (error: any) {
      console.error('Error fetching requests:', error);
      setError(error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [firestore, organizationId, retrospectiveId]);

  const fetchPendingRequests = useCallback(() => {
    try {
      setLoading(true);

      const requestsCollectionPath = `${ORGANIZATIONS_COLLECTION}/${organizationId}/${BOARD_COLLECTION}/${retrospectiveId}/requests`;
      const requestsCollection = collection(firestore, requestsCollectionPath);

      // Set up a real-time listener for the requestsCollection
      const unsubscribe = onSnapshot(
        query(requestsCollection, where('status', '==', 'pending')),
        async (querySnapshot) => {
          const requests = [] as any[];

          for (const doc of querySnapshot.docs) {
            const requestData = doc.data();
            const userData = await getRefData(requestData.userRef);

            if (userData) {
              requestData.userName = userData.fullName;
              requestData.email = userData.email;
            }

            requests.push(requestData);
          }
          // Update the state with the new data
          setPendingRequests(requests);
        },
        onListenerError('use-get-board-by-retrospective', {
          setError,
          setLoading,
        }),
      );

      // Return the unsubscribe function to clean up the listener when needed
      return () => unsubscribe();
    } catch (error: any) {
      console.error('Error fetching requests:', error);
      setError(error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [firestore, organizationId, retrospectiveId]);

  const userHasRequested = useCallback(
    async (userId: string) => {
      try {
        setLoading(true);

        const requestsCollectionPath = `${ORGANIZATIONS_COLLECTION}/${organizationId}/${BOARD_COLLECTION}/${retrospectiveId}/requests`;
        const requestsCollection = collection(firestore, requestsCollectionPath);

        // Initialize the query with userId
        const querySnapshot = await getDocs(
          query(requestsCollection, where('userId', '==', userId)),
        );
        for (const requestDoc of querySnapshot.docs) {
          const userData = await getRefData(requestDoc.data().userRef);
          userData.status = requestDoc.data().status;
          setRequestedUser(userData);
        }

        // Check if there are any requests with the given userId
        const hasRequested = !querySnapshot.empty;

        //    setError(null);
        return hasRequested;
      } catch (error: any) {
        console.error('Error fetching requests:', error);
        setError(error);
      } finally {
        setLoading(false);
      }
    },
    [firestore, organizationId, retrospectiveId],
  );

  useEffect(() => {
    // Fetch board when the component mounts or when organizationId / retrospectiveId changes
    if (!organizationId || !retrospectiveId) {
      return;
    }

    // Each fetch returns its own teardown, and `fetchBoard` is async so its
    // teardown only exists once the promise settles. Nothing collected them
    // before, so the listeners survived unmount and another set was added every
    // time the organization or the retrospective changed.
    let cancelled = false;
    const teardowns: Array<() => void> = [];

    const start = async (fetch: () => unknown) => {
      const teardown = await fetch();

      if (typeof teardown !== 'function') {
        return;
      }

      if (cancelled) {
        teardown();
      } else {
        teardowns.push(teardown as () => void);
      }
    };

    void start(fetchBoard);
    void start(fetchRequests);
    void start(fetchMembers);

    return () => {
      cancelled = true;

      for (const teardown of teardowns) {
        teardown();
      }
    };
  }, [organizationId, retrospectiveId]);

  const getRefData = async (ref: any) => {
    const refDocSnapshot = await getDoc(ref);
    if (refDocSnapshot.exists()) {
      return refDocSnapshot.data() as any;
    }
    return null;
  };

  const fetchMembers = useCallback(() => {
    try {
      setLoading(true);

      const boardRef = doc(boardCollection, retrospectiveId);

      // See `fetchBoard`: the teardown returned from a snapshot callback is
      // discarded, so the inner listener has to be held out here to be closed.
      let unsubscribeRetrospective: (() => void) | undefined;

      const unsubscribe = onSnapshot(boardRef, (boardSnapshot) => {
        if (boardSnapshot.exists()) {
          const boardData = boardSnapshot.data();

          const retrospectiveRef = boardData.retrospectiveRef;

          unsubscribeRetrospective?.();

          // Usar onSnapshot para obtener actualizaciones en tiempo real de la retrospectiva
          unsubscribeRetrospective = onSnapshot(
            retrospectiveRef,
            async (retrospectiveSnapshot: any) => {
              if (retrospectiveSnapshot.exists()) {
                const retrospectiveData = retrospectiveSnapshot.data() as any;

                const members = retrospectiveData.members;
                retrospectiveData.teamId = boardData.teamId;
                retrospectiveData.authors = boardData.authors;
                retrospectiveData.votes = boardData.votes;

                // Obtener datos de usuario de la colección de usuarios
                const getUserInfoPromises = Object.values(members).map(
                  async (user: any) => {
                    const userInfo = await getRefData(user.user);

                    if (userInfo) {
                      userInfo.role = user.role;
                      userInfo.active = user.active;
                      userInfo.userId = user.userId;
                      userInfo.created = user.created;
                      return userInfo;
                    }

                    return null;
                  },
                );

                const userInfos = await Promise.all(getUserInfoPromises);
                const filteredUserInfos = userInfos.filter(
                  (userInfo) => userInfo !== null,
                );

                const sort: any[] = filteredUserInfos.sort((a: any, b: any) => {
                  if (a.role > b.role) {
                    return -1;
                  } else if (a.role < b.role) {
                    return 1;
                  } else {
                    if (a.active && !b.active) {
                      return -1;
                    } else if (!a.active && b.active) {
                      return 1;
                    } else {
                      const dateA = new Date(a.created) as any;
                      const dateB = new Date(b.created) as any;
                      return dateA - dateB;
                    }
                  }
                });

                setMembers(sort);
              } else {
                const error = {
                  name: 'Retrospective not found',
                  message: 'Retrospective does not exist',
                  code: 404,
                };
                setError(error);
              }
            },
            onListenerError('use-get-board-by-retrospective', {
              setError,
              setLoading,
            }),
          );

        } else {
          const error = {
            name: 'Board not found',
            message: 'Board does not exist',
            code: 404,
          };
          setError(error);
        }
      },
        onListenerError('use-get-board-by-retrospective', {
          setError,
          setLoading,
        }),
      );

      // Limpieza de la suscripción de la tabla cuando el componente se desmonta
      return () => {
        unsubscribeRetrospective?.();
        unsubscribe();
      };
    } catch (error) {
      console.error('Error fetching members:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [boardCollection, retrospectiveId]);

  return {
    retrospective,
    loading,
    error,
    fetchBoard,
    fetchMembers,
    fetchPendingRequests,
    pendingRequests,
    requests,
    fetchRequests,
    userHasRequested,
    requestedUser,
    members: boardMembers,
  };
}
