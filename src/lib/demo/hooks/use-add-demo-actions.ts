import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface AddDemoActionsProps {
  description: string;
  assignee: string;
  date: any;
  id: string;
  order: number;
}

/**
 * @name useAddDemoActions
 * @description Add a demo action data using an HTTP request to the
 * Board API endpoint.
 */
function useAddDemoActions() {
  const endpoint = `/api/demo/add-demo-actions`;
  const fetcher = useApiRequest<void, AddDemoActionsProps>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
    });
  });
}

export default useAddDemoActions;
