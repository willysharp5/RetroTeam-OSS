import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface UpdateActionsProps {
  description: string;
  assignee: string;
  date: any;
  id: string;
  order: number;
  retrospectiveId: string;
}

/**
 * @name useUpdateJiraAction
 * @description Connect action to jira
 * Board API endpoint.
 */
function useUpdateJiraAction(organizationId: string) {
  const endpoint = `/api/actions/${organizationId}/update-jira`;
  const fetcher = useApiRequest<void, UpdateActionsProps>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });
}

export default useUpdateJiraAction
