import { getOrganizationsCollection } from "../collections";
import { getOrganizationById } from "../queries";

interface Params {
  organizationId: string;
  userId: string;
}

export async function updateByOrganization(params: Params): Promise<void> {
  const { organizationId, userId } = params;

  try {
    const organization = await getOrganizationById(organizationId);
    const organizationData = organization.data();

    if (!organizationData) {
      throw new Error(`Organization data with ID ${organizationId} was not found`);
    }

    const organizationRef = getOrganizationsCollection().doc(organizationId);

    await organizationRef.update({
      updatedBy: userId,
    });
  } catch (error) {
    console.error(`Failed to update organization with ID ${organizationId}:`, error);
    throw error; // Rethrow the error after logging it
  }
}
