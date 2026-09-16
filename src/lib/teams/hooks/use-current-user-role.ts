import { useUserSession } from '~/core/hooks/use-user-session';
import { useCurrentOrganization } from '~/lib/organizations/hooks/use-current-organization';
import useFetchTeamByUser from '~/lib/server/teams/get-team-user';

/**
 * @name useCurrentTeamMemberRole
 * @description Hook to fetch the user's current role within a specific team in Firebase.
 * @param {string} teamId - ID del equipo
 */
export function useCurrentTeamMemberRole(teamId: string | any) {
  const organization = useCurrentOrganization();
  const user = useUserSession();
  const userId = user?.auth?.uid;

  const { data } = useFetchTeamByUser(organization?.id, teamId, userId);

  if (organization && userId) {
    return data;
  }

  return null;
}
