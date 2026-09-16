import { useEffect, useState } from 'react';
import { useFirestore } from 'reactfire';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { USERS_COLLECTION } from '~/lib/firestore-collections';

function useFetchGroups(
  organization: string,
  teamId: string,
  retrospectiveId: string,
  allowViewAllComments: boolean,
  currentUserRole: number,
  selectedTab: number,
) {
  const firestore = useFirestore();
  const groupsCollectionPath = `organizations/${organization}/board/${retrospectiveId}/groups`;
  const groupsCollectionRef = collection(firestore, groupsCollectionPath);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[] | null>(null);
  const [error, setError] = useState<any | null>(null);

  const getUserData = async (id: string) => {
    if (id !== '') {
      try {
        const userRef = doc(firestore, USERS_COLLECTION, id);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          return userData;
        }
      } catch (error) {
        console.error('Error', error);
        return null;
      }
    }
  };

  const getRefData = async (ref: any) => {
    const refDocSnapshot = await getDoc(ref);
    if (refDocSnapshot.exists()) {
      return refDocSnapshot.data() as any;
    }
    return null;
  };

  const fetchData = () => {
    if (organization && teamId && retrospectiveId) {
      let groupsQuery;
      if (selectedTab === 4) {
        groupsQuery = query(
          groupsCollectionRef,
          orderBy('votes', 'desc'),
          orderBy('created'),
        );
      } else {
        groupsQuery = query(groupsCollectionRef, orderBy('order'));
      }

      const unsubscribe = onSnapshot(
        groupsQuery,
        async (querySnapshot) => {
          const groupData = [] as any;
          for (const docSnapshot of querySnapshot.docs) {
            const membersData = [] as any;
            const item = docSnapshot.data();

            if (item.comments) {
              const comments = [] as any[];

              for (const commentKey of Object.keys(item.comments)) {
                const comment = item.comments[commentKey];
                const commentData = await getRefData(comment.ref);

                if (commentData?.author) {
                  const userData = await getUserData(commentData.author);
                  commentData.user = userData;
                  commentData.user.id = commentData.author;
                  membersData.push(userData);
                }
                if (commentData) {
                  comments.push(commentData);
                }
              }
              comments.sort((a, b) => {
                if (a.order === b.order) {
                  return a.created.toMillis() - b.created.toMillis();
                }
                return a.order - b.order;
              });

              function removeDuplicates(array: any, property: any) {
                const seen = new Set();
                return array.filter((item: any) => {
                  const value = item[property];
                  if (seen.has(value)) {
                    return false;
                  }
                  seen.add(value);
                  return true;
                });
              }

              const uniqueMembersData = removeDuplicates(membersData, 'id');
              item.comments = comments;
              item.members = uniqueMembersData;
              groupData.push(item);
            }
          }

          setData(groupData);
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching documents:', error);
          setError(error);
          setLoading(false);
        },
      );



      // Cleanup listener on unmount
      return () => {
        unsubscribe();
      };
    }
  };

  useEffect(() => {

    const unsubscribe = fetchData();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [
    organization,
    teamId,
    retrospectiveId,
    allowViewAllComments,
    currentUserRole,
    selectedTab,
  ]);

  const refetch = () => {
    setLoading(true);
    fetchData();
  };

  return { loading, data, error, refetch };
}

export default useFetchGroups;