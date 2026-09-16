import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';
import { Task } from '~/lib/actions/types/actions';

interface UpdateActionsProps {
  actions: Task[];
  retrospectiveId: string;
  organization: string;
}

/**
 * @name useUpdateActions
 * @description Update a board action data using an HTTP request to the
 * Board API endpoint.
 */
function useUpdateActionsOrder() {
  const endpoint = `/api/board/update-actions-order`;
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

export default useUpdateActionsOrder;
