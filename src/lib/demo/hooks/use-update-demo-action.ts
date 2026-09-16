import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface useUpdateDemoActionsProps {
  description: string;
  assignee: string;
  date: any;
  id: string;
  order: number;
}

/**
 * @name useUpdateActions
 * @description Update a board action data using an HTTP request to the
 * Board API endpoint.
 */
function useUpdateDemoActions() {
  const endpoint = `/api/demo/demo-actions`;
  const fetcher = useApiRequest<void, useUpdateDemoActionsProps>();

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

export default useUpdateDemoActions;
