import {
  collection,
  query,
  where,
  orderBy,
  startAfter,
  limit,
  getDocs,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { useCallback, useState, useEffect } from 'react';
import { useFirestore, useUser } from 'reactfire';
import {
  BOARD_COLLECTION,
  ORGANIZATIONS_COLLECTION,
} from '~/lib/firestore-collections';
import { TEAMS_COLLECTION } from '~/lib/firestore-collections';
import { RETROSPECTIVES_COLLECTION } from '~/lib/firestore-collections';
import { Retrospectives } from '../types/retrospectives';
import { Comment, Group } from '~/lib/board/types/types';

interface LoadedPages {
  [key: number]: Retrospectives[];
}

interface RetrospectivesFilters {
  archived?: boolean;
  ownBoards?: boolean;
  sharedBoards?: boolean;
  teamBoards?: boolean;
}

interface AdditionalFilters {
  finished?: boolean;
  accessType?: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}
export function useGetRetrospectives(
  organizationId: string,
  teamId: string,
  pageSize: number = 4,
  type?: string,
  userId?: string,
) {
  const firestore = useFirestore();
  const retrospectivesCollectionPath = `${ORGANIZATIONS_COLLECTION}/${organizationId}/${RETROSPECTIVES_COLLECTION}`;
  const retrospectivesCollection = collection(
    firestore,
    retrospectivesCollectionPath,
  );
  const [loadedPages, setLoadedPages] = useState<LoadedPages>({});
  const [loading, setLoading] = useState<boolean>(true);

  const [retrospectives, setRetrospectives] = useState<Retrospectives[]>([]);

  const [filters, setFilters] = useState<RetrospectivesFilters>({});
  const [additionalFilters, setAdditionalFilters] = useState<AdditionalFilters>(
    {},
  );

  const [error, setError] = useState<Error | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);

  const [totalRetrospectives, setTotalRetrospectives] = useState<number>(0);
  const [totalComments, setTotalComments] = useState(0);
  const [totalActions, setTotalActions] = useState(0);
  const [totalCreatedRetrospectives, setTotalCreatedRetrospectives] =
    useState(0);

  const [tagCount, setTagCount] = useState<any>([]);
  const [enoughTags, setEnoughTags] = useState(false);

  const { data: user } = useUser();

  const fetchRetrospectives = useCallback(
    async (page: number) => {
      try {
        setLoading(true);

        // Calculate the startAt value based on the page number and page size
        const startAtIndex = (page - 1) * pageSize;

        // Initialize the query with organizationId, ordered by date in descending order
        let q = query(
          retrospectivesCollection,
          where('organization', '==', organizationId),
        );

        // Add a where filter for archived equals false or where archived doesn't exist
        q = query(q, where('archived', '==', filters?.archived ? true : false));

        if (filters?.ownBoards && user) {
          q = query(q, where('createdBy', '==', user.uid));
        }

        if (filters?.sharedBoards && user) {
          q = query(q, where('createdBy', '!=', user.uid));
        }

        if (filters?.teamBoards) {
          if (teamId) {
            const teamRef = doc(
              firestore,
              ORGANIZATIONS_COLLECTION,
              organizationId,
              TEAMS_COLLECTION,
              teamId,
            );
            q = query(q, where('team', '==', teamRef));
          }
          else {
            setRetrospectives([])
            setTotalRetrospectives(0)
            return;
          }
        }

        // Testing the new filters
        // Status Open/Closed
        if (additionalFilters?.hasOwnProperty('finished')) {
          q = query(q, where('finished', '==', additionalFilters.finished));
        }
        // Access filter
        if (additionalFilters?.hasOwnProperty('accessType')) {
          q = query(
            q,
            where('access.type', '==', additionalFilters.accessType),
          );
        }
        // Date filter
        if (
          additionalFilters?.dateRange?.startDate &&
          additionalFilters?.dateRange?.endDate
        ) {
          let startDate = new Date(additionalFilters.dateRange.startDate);
          let endDate = new Date(additionalFilters.dateRange.endDate);

          startDate.setUTCHours(0, 0, 0, 0);
          endDate.setUTCHours(23, 59, 59, 999);

          const startTimestamp = Timestamp.fromDate(startDate);
          const endTimestamp = Timestamp.fromDate(endDate);

          q = query(
            q,
            where('date', '>=', startTimestamp),
            where('date', '<=', endTimestamp),
          );
        }

        // Order by date after order by archived
        q = query(
          q,
          orderBy(filters?.sharedBoards ? 'createdBy' : 'date', 'desc'),
        );

        // If not the first page, use startAfter to paginate
        if (startAtIndex > 0) {
          const startAfterDoc =
            loadedPages[page - 1][loadedPages[page - 1].length - 1];
          q = query(q, startAfter(startAfterDoc.date));
        }


        // Limit the results to the specified pageSize
        if (!filters.sharedBoards) {
          q = query(q, limit(pageSize));
        }

        const querySnapshot = await getDocs(q);

        // Map the documents to an array of retrospectives
        const newRetrospectivesData: Retrospectives[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (filters?.sharedBoards && user) {
            let pushCount = 0;
            if (pushCount < pageSize) {
              if (data.members[user?.uid]) {
                newRetrospectivesData.push({
                  ...doc.data(),
                  id: doc.id,
                } as Retrospectives);
                pushCount++;
              }
            }
          } else {
            newRetrospectivesData.push({
              ...doc.data(),
              id: doc.id,
            } as Retrospectives);
          }
        });

        // Update the state with the new data
        setRetrospectives(newRetrospectivesData);

        const totalRetrospectives = await getDocs(q);
        if (filters?.sharedBoards && user) {
          let totalRetrospectivesData = 0;
          totalRetrospectives.forEach((doc) => {
            const data = doc.data();
            if (data.members[user?.uid]) {
              totalRetrospectivesData++;
            }
          });
          const totalPages = Math.ceil(totalRetrospectivesData / pageSize);
          setTotalPages(totalPages);
          setTotalRetrospectives(totalRetrospectivesData);
        } else {
          const totalPages = Math.ceil(totalRetrospectives.size / pageSize);
          setTotalPages(totalPages);
          setTotalRetrospectives(totalRetrospectives.size);
        }


        setError(null);

        const totalCreatedRetrospectives = await getDocs(
          retrospectivesCollection,
        );
        setTotalCreatedRetrospectives(totalCreatedRetrospectives.size);

        setCurrentPage(page);
        setLoadedPages((prevState) => {
          return { ...prevState, [page]: newRetrospectivesData };
        });
      } catch (error: any) {
        console.error('Error fetching retrospectives:', error);
        setRetrospectives([]);
        setError(error);
      } finally {
        setLoading(false);
      }
    },
    [
      organizationId,
      retrospectivesCollection,
      pageSize,
      filters,
      loadedPages,
      user,
      firestore,
      teamId,
      additionalFilters,
    ],
  );

  const fetchAllRetrospectives = useCallback(
    async (number: number, startDate: any, endDate: any, teamId: any) => {

      try {
        let total = 0;
        let totalActions = 0;

        const comments = [] as any;

        setLoading(true);
        // Initialize the query with organizationId, ordered by date in descending order
        let q = query(
          retrospectivesCollection,
          where('organization', '==', organizationId),
        );

        if (teamId) {
          const teamRef = doc(
            firestore,
            ORGANIZATIONS_COLLECTION,
            organizationId,
            TEAMS_COLLECTION,
            teamId,
          );

          q = query(q, where('team', '==', teamRef));

        }

        // Add a where filter for archived equals false or where archived doesn't exist
        q = query(q, where('archived', '==', false));

        if (startDate !== null && endDate != null) {
          const startOfDay = new Date(startDate);
          const endOfDay = new Date(endDate);

          startOfDay.setUTCHours(0, 0, 0, 0);
          endOfDay.setUTCHours(23, 59, 59, 999);

          const startTimestamp = Timestamp.fromDate(startOfDay);
          const endTimestamp = Timestamp.fromDate(endOfDay);

          q = query(
            q,
            where('date', '>=', startTimestamp),
            where('date', '<=', endTimestamp),
            orderBy('date', 'desc'),
          );
        } else {
          q = query(q, orderBy('date', 'desc'), limit(number));
        }
        const groups = [] as any;

        const querySnapshot = await getDocs(q);

        const getComments = async (retrospectiveId: string) => {
          const commentCollectionPath = `${ORGANIZATIONS_COLLECTION}/${organizationId}/${BOARD_COLLECTION}/${retrospectiveId}/comments`;
          const commentsCollection = collection(
            firestore,
            commentCollectionPath,
          );
          const commentQuerySnapshot = await getDocs(commentsCollection);
          commentQuerySnapshot.forEach((doc) => {
            const commentData = doc.data();
            comments.push(commentData);
          });
          return commentQuerySnapshot.size;
        };

        const getGroups = async (retrospectiveId: string) => {
          const gorupsCollectionPath = `${ORGANIZATIONS_COLLECTION}/${organizationId}/${BOARD_COLLECTION}/${retrospectiveId}/groups`;
          const groupsCollection = collection(firestore, gorupsCollectionPath);
          const groupSnapshot = await getDocs(groupsCollection);

          groupSnapshot.forEach((doc) => {
            const groupData = doc.data();
            groups.push(groupData);
          });
        };

        const getActions = async (retrospectiveId: string) => {
          const actionCollectionPath = `${ORGANIZATIONS_COLLECTION}/${organizationId}/${BOARD_COLLECTION}/${retrospectiveId}/actions`;
          const actionsCollection = collection(firestore, actionCollectionPath);
          const commentQuerySnapshot = await getDocs(actionsCollection);

          return commentQuerySnapshot.size;
        };

        // COMMENT PROMISE
        const commentPromises = [] as any;

        querySnapshot.forEach((doc) => {
          const retrospectiveData = doc.data();
          commentPromises.push(getComments(retrospectiveData.id)); // Push promises to the array
        });

        // Wait for all promises to resolve
        const commentCounts = await Promise.all(commentPromises);

        // Sum up all comments counts
        total = commentCounts.reduce((acc, count) => acc + count, 0);
        setTotalComments(total);

        // ACTION PROMISE

        const actionPromises = [] as any;

        querySnapshot.forEach((doc) => {
          const retrospectiveData = doc.data();
          actionPromises.push(getActions(retrospectiveData.id));
        });

        // Wait for all promises to resolve
        const actionCounts = await Promise.all(actionPromises);

        // Sum up all comments counts
        totalActions = actionCounts.reduce((acc, count) => acc + count, 0);
        setTotalActions(totalActions);

        // GROUP PROMISE

        const groupPromises = [] as any;

        querySnapshot.forEach((doc) => {
          const retrospectiveData = doc.data();
          groupPromises.push(getGroups(retrospectiveData.id));
        });

        // Wait for all promises to resolve
        await Promise.all(groupPromises);

        let commentsWithGroupCount = 0;
        let groupsWithTags = 0;

        comments.forEach((comment: Comment) => {
          if (comment.group !== '') {
            commentsWithGroupCount++;
          }
        });

        const isOver50Percent = commentsWithGroupCount / totalComments > 0.5;

        if (isOver50Percent) {
          setEnoughTags(true);
        } else {
          setEnoughTags(false);
        }

        const tagCounts = {} as any;

        groups.forEach((item: Group) => {
          if (item.tags.length > 0) {
            groupsWithTags++;
          }
          if (item.tags && Array.isArray(item.tags)) {
            item.tags.forEach((tag) => {
              if (tag.name in tagCounts) {
                tagCounts[tag.name]++;
              } else {
                tagCounts[tag.name] = 1;
              }
            });
          }
        });

        const tagCountsArray = Object.entries(tagCounts)
          .map(([tagName, count]) => ({
            name: tagName,
            total: count,
          }))
          .slice(0, 10);

        setTagCount(tagCountsArray);

        const isOver50PercentTags = groupsWithTags / groups.length > 0.5;

        if (isOver50PercentTags) {
          setEnoughTags(true);
        } else {
          setEnoughTags(false);
        }

        setError(null);
        setTotalRetrospectives(querySnapshot.size);
      } catch (error: any) {
        console.error('Error fetching retrospectives:', error);
        setRetrospectives([]);
        setError(error);
      } finally {
        setLoading(false);
      }
    },
    [organizationId, retrospectivesCollection, firestore, totalComments],
  );

  const fetchAIRetrospectives = useCallback(
    async (number: number, startDate: any, endDate: any, teamId: string) => {
      try {
        // setLoading(true);

        // Initialize the query with organizationId, ordered by date in descending order
        let q = query(
          retrospectivesCollection,
          where('organization', '==', organizationId),
        );

        // If filter with team

        if (teamId !== '' && teamId) {
          const teamRef = doc(
            firestore,
            ORGANIZATIONS_COLLECTION,
            organizationId,
            TEAMS_COLLECTION,
            teamId,
          );
          q = query(q, where('team', '==', teamRef));
        }

        // Add a where filter for archived equals false or where archived doesn't exist
        q = query(q, where('archived', '==', false));

        // Order by date after order by archived
        if (startDate !== null && endDate != null) {
          q = query(
            q,
            where('date', '>=', startDate),
            where('date', '<=', endDate),
            orderBy('date', 'desc'),
          );
        } else {
          q = query(q, orderBy('date', 'desc'), limit(number));
        }

        const querySnapshot = await getDocs(q);

        const getComments = async (retrospectiveId: string) => {
          const commentCollectionPath = `${ORGANIZATIONS_COLLECTION}/${organizationId}/${BOARD_COLLECTION}/${retrospectiveId}/comments`;
          const commentsCollection = collection(
            firestore,
            commentCollectionPath,
          );
          const commentQuerySnapshot = await getDocs(commentsCollection);
          const comments = [] as any;
          commentQuerySnapshot.forEach((doc) => {
            comments.push(doc.data());
          });
          return comments;
        };

        // Process each retrospective and fetch its comments
        const dataPromises = querySnapshot.docs.map(async (doc) => {
          const retrospectiveData = doc.data();
          const comments = await getComments(doc.id);
          return {
            ...retrospectiveData,
            RetrospectiveID: doc.id,
            comments: comments,
          };
        });

        // Wait for all promises to resolve
        const fetchedData = await Promise.all(dataPromises);

        setError(null);
        return fetchedData;
      } catch (error: any) {
        console.error('Error fetching retrospectives:', error);
        setError(error);
      } finally {
        //   setLoading(false);
      }
    },
    [organizationId, retrospectivesCollection, firestore],
  );

  const fetchAllMyRetrospectives = useCallback(async () => {
    try {
      setLoading(true);
      // Initialize the query with organizationId, ordered by date in descending order

      let q = query(
        retrospectivesCollection,
        where('organization', '==', organizationId),
      );

      // Add a where filter for archived equals false or where archived doesn't exist
      q = query(q, where('archived', '==', false));

      // Order by date after order by archived

      q = query(q, orderBy('date', 'desc'));
      const retrospectiveData: any[] = []; // Define retrospectiveData as an array

      const userId = user?.uid as string;

      const querySnapshot = await getDocs(q);

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.members[userId]) {
          if (data.members[userId]?.active) {
            retrospectiveData.push(data);
          }
        }
      });

      setRetrospectives(retrospectiveData);
      setError(null);
    } catch (error: any) {
      console.error('Error fetching retrospectives:', error);
      setRetrospectives([]);
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [organizationId, retrospectivesCollection, user]);

  useEffect(() => {
    if (type === 'all') {
      fetchAllRetrospectives(15, null, null, null);
    } else if (type === 'mine') {
      fetchAllMyRetrospectives();
    } else {
      // Fetch retrospectives when the component mounts or when organizationId changes
      fetchRetrospectives(1);
      setLoadedPages({});
    }
  }, [organizationId, pageSize, userId, teamId]);



  useEffect(() => {
    fetchRetrospectives(1);
  }, [filters, additionalFilters]);

  return {
    retrospectives,
    loading,
    error,
    fetchRetrospectives,
    fetchAllRetrospectives,
    fetchAIRetrospectives,
    currentPage,
    totalPages,
    totalRetrospectives,
    totalCreatedRetrospectives,
    totalComments,
    totalActions,
    filters,
    setFilters,
    additionalFilters,
    setAdditionalFilters,
    tagCount,
    enoughTags,
  };
}
