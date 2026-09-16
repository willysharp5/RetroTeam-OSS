import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

/**
 * @name useFetchJiraEpics
 * @description Search user's JIRA epics using an HTTP request to Jira API
 * Jira API endpoint.
 */
function useFetchJiraEpics() {
  const endpoint = `/api/jira/get-epics`;
  const fetcher = useApiRequest<void>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
    });
  });
}

export default useFetchJiraEpics;