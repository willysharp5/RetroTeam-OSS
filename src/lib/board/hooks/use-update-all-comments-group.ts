import { useFirestore } from 'reactfire';
import { collection, getDocs, query, updateDoc, doc } from 'firebase/firestore';

function useUpdateAllCommentsGroup(
  organization: string,
  retrospectiveId: string,
) {
  const firestore = useFirestore();
  const commentsCollectionPath = `organizations/${organization}/board/${retrospectiveId}/comments`;
  const commentsCollectionRef = collection(firestore, commentsCollectionPath);

  const updateAllDocuments = async () => {
    const commentsQuery = query(commentsCollectionRef);

    try {
      const querySnapshot = await getDocs(commentsQuery);

      const updatePromises = querySnapshot.docs.map((docSnapshot) => {
        return updateDoc(
          doc(firestore, commentsCollectionPath, docSnapshot.id),
          { group: '' }, // Update the group field to an empty string
        );
      });

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error updating documents:', error);
    }
  };

  return { updateAllDocuments };
}

export default useUpdateAllCommentsGroup;
