import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

/**
 * @name useAddJiraTicket
 * @description Add JIRA ticket using an HTTP request to Jira API
 * Jira API endpoint.
 */
function useAddJiraTicket() {
  const endpoint = `/api/jira/add-ticket`;
  const fetcher = useApiRequest<void>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
    });
  });
}

export default useAddJiraTicket;