import { getUserRefById } from "../queries";

/**
 * @name getOrganizationMembers
 * @description Returns the {@link UserInfo} object from the members of an organization
 */
export async function getUserById(userId: string) {

    const users = await getUserRefById(userId);

    return { success: true, data: users.data() }
}
