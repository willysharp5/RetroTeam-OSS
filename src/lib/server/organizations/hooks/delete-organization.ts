import { getOrganizationsCollection, getUsersCollection } from '~/lib/server/collections';

/**
 * @name deleteSubCollectionsRecursively
 * @description Recursively delete all subcollections and their documents.
 */
async function deleteSubCollectionsRecursively(docRef: any) {
    const subCollections = await docRef.listCollections();

    for (const subCollection of subCollections) {
        const documents = await subCollection.listDocuments();

        for (const document of documents) {
            await deleteSubCollectionsRecursively(document);

            await document.delete();
        }
    }
}

/**
 * @name deleteOrganization
 * @description Hook to delete an organization by ID
 */
interface Params {
    id: string;
    userId: string;
}

export async function deleteOrganization({ id, userId }: Params) {
    const userRef = getUsersCollection().doc(userId);
    const docSnapshot = await userRef.get();
    if (docSnapshot.exists) {
        const userData = docSnapshot.data()
        if (userData?.superAdmin) {
            try {
                const organizationRef = getOrganizationsCollection().doc(id);
                const docSnapshot = await organizationRef.get();
                if (docSnapshot.exists) {
                    // Recursively delete subcollections
                    await deleteSubCollectionsRecursively(organizationRef);

                    // Delete the organization document
                    await organizationRef.delete();

                    return { success: true };
                } else {
                    return {
                        success: false,
                        message: `Organization with ID ${id} does not exist.`,
                    };
                }
            } catch (error) {
                console.error('Error', error);
                return {
                    success: false,
                    message: 'An error occurred while deleting the organization.',
                };
            }
        } else {
            return {
                success: false,
                message: `You don't have permission to delete this organization.`,
            };
        }
    } else {
        return {
            success: false,
            message: `User no exists`,
        };
    }

}
