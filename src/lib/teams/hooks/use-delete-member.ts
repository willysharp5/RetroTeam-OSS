import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface updateTeamProps {
  name: string;
  userId: string;
  organization: string;
}

/**
 * @name useDeleteTeamMember
 * @description Delete team member using an HTTP request to the
 *  @param organizationId;
 * @param teamId;
 * @param userId;
 * @param removedUserName;
 * @param removedUserEmail;
 * @param organizationName;
 * @param adminName;
 * @param currentUserId;
 * team members API endpoint.
 */
function useDeleteTeamMember(
  organizationId: string,
  teamId: string,
  userId: string,
  removedUserName: string,
  removedUserEmail: string,
  teamName: string,
  adminName: string,
  organizationName: string,
  currentUserId: string,
) {
  const endpoint = `/api/teams/${organizationId}/${teamId}/${userId}?removedUserName=${removedUserName}&removedUserEmail=${removedUserEmail}&organizationName=${organizationName}&teamName=${teamName}&adminName=${adminName}&currentUserId=${currentUserId}`;
  const fetcher = useApiRequest<void, updateTeamProps>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
      method: 'DELETE',
    });
  });
}

export default useDeleteTeamMember;
