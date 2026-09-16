import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface Props {
  userId: string;
  organization: string;
}

/**
 * @name useAddActions
 * @description Delete team data using an HTTP request to the
 *  @param teamId;
 * teams API endpoint.
 */
function useDeleteTeam(teamId: string, organization: string) {
  const endpoint = `/api/teams/delete/${organization}/${teamId}`;
  const fetcher = useApiRequest<void, Props>();
  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
      method: 'DELETE',
    });
  });
}

export default useDeleteTeam;
