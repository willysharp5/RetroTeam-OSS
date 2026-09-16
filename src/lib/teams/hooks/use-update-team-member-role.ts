import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface updateTeamProps {
  name: string;
  userId: string;
  organization: string;
}

/**
 * @name useAddActions
 * @description Update team data using an HTTP request to the
 *  @param teamId;
 * teams API endpoint.
 */
function useUpdateTeamMemberRole(organizationId: string, teamId: string) {
  const endpoint = `/api/teams/${organizationId}/${teamId}/update-member-role`;
  const fetcher = useApiRequest<void, updateTeamProps>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
      method: 'PUT',
    });
  });
}

export default useUpdateTeamMemberRole;
