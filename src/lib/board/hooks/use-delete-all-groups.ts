import { useFirestore } from 'reactfire';
import { collection, getDocs, query, deleteDoc, doc } from 'firebase/firestore';

function useDeleteAllGroups(organization: string, retrospectiveId: string) {
  const firestore = useFirestore();
  const groupsCollectionPath = `organizations/${organization}/board/${retrospectiveId}/groups`;
  const groupsCollectionRef = collection(firestore, groupsCollectionPath);

  const deleteAllDocuments = async () => {
    const groupsQuery = query(groupsCollectionRef);

    try {
      const querySnapshot = await getDocs(groupsQuery);

      const deletePromises = querySnapshot.docs.map((docSnapshot) => {
        return deleteDoc(doc(firestore, groupsCollectionPath, docSnapshot.id));
      });

      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error deleting documents:', error);
    }
  };

  return { deleteAllDocuments };
}

export default useDeleteAllGroups;
