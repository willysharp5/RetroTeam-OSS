import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface AddActionsProps {
  description: string;
  assignee: string;
  organization: string;
  team: string;
  date: any;
  status: string;
  archive: boolean;
  order: number;
  author: string;
}

/**
 * @name useAddActions
 * @description Add a actions data using an HTTP request to the
 * actions API endpoint.
 */
function useAddActions() {
  const endpoint = `/api/actions`;
  const fetcher = useApiRequest<void, AddActionsProps>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
    });
  });
}

export default useAddActions;
