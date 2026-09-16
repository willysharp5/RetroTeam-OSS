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
 * @name useUpdateActions
 * @description Update a board action data using an HTTP request to the
 * Board API endpoint.
 */
function useUpdateActions() {
  const endpoint = `/api/board/actions`;
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

export default useUpdateActions;
