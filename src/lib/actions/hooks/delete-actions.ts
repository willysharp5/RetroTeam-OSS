import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface DeleteActionsProps {
  organization: string;
  actionId: string;
}

/**
 * @name useDeleteActions
 * @description Delete actions data using an HTTP request to the
 * actions API endpoint.
 * @param organization;
 * * @param actionId;
 */
function useDeleteActions(organizationId: string, id: string, teamId: string) {
  const endpoint = `/api/actions/${organizationId}/${id}?teamId=${teamId}`;
  const fetcher = useApiRequest<void, DeleteActionsProps>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
      method: 'DELETE',
    });
  });
}

export default useDeleteActions;
