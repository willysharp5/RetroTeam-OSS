import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

/**
 * @name useFetchJiraProjects
 * @description Search user's JIRA projects using an HTTP request to Jira API
 * Jira API endpoint.
 */
function useFetchJiraProjects() {
  const endpoint = `/api/jira/get-projects`;
  const fetcher = useApiRequest<void>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
    });
  });
}

export default useFetchJiraProjects;