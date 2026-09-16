import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

/**
 * @name useFetchJiraIssues
 * @description Search user's JIRA issues using an HTTP request to Jira API
 * Jira API endpoint.
 */
function useFetchJiraIssues() {
  const endpoint = `/api/jira/get-issue-types`;
  const fetcher = useApiRequest<void>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
    });
  });
}

export default useFetchJiraIssues;