import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface AddTeamsProps {
  name: string;
  userId: string;
  organization: string;
}

/**
 * @name useAddActions
 * @description Add a actions data using an HTTP request to the
 * actions API endpoint.
 */
function useAddTeams() {
  const endpoint = `/api/teams`;
  const fetcher = useApiRequest<void, AddTeamsProps>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
    });
  });
}

export default useAddTeams;
