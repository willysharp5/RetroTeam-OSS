import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface AddActionsProps {
  description: string;
  assignee: string;
  date: any;
  id: string;
  order: number;
  retrospectiveId: string;
}

/**
 * @name useAddActions
 * @description Add an action data using an HTTP request to the
 * Board API endpoint.
 */
function useAddActions() {
  const endpoint = `/api/board/add-actions`;
  const fetcher = useApiRequest<void, AddActionsProps>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
    });
  });
}

export default useAddActions;
