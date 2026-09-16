import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface updateTeamProps {
  name: string;
  userId: string;
  organization: string;
}

/**
 * @name useAddActions
 * @description Desactive team member using an HTTP request to the
 *  @param teamId;
 * team members API endpoint.
 */
function useActiveTeamMember(
  organizationId: string,
  teamId: string,
  userId: string,
  activatedUserEmail: string,
  removedUserEmail: string,
  teamName: string,
  adminName: string,
  organizationName: string,
  currentUserId: string,
) {
  const endpoint = `/api/teams/${organizationId}/${teamId}/${userId}/active?activatedUserEmail=${activatedUserEmail}&removedUserEmail=${removedUserEmail}&organizationName=${organizationName}&teamName=${teamName}&adminName=${adminName}&currentUserId=${currentUserId}`;
  const fetcher = useApiRequest<void, updateTeamProps>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
      method: 'PUT',
    });
  });
}

export default useActiveTeamMember;
