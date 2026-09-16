import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface UpdateActionsProps {
  description: string;
  assignee: string;
  date: string;
  organization: string;
  status: string;
  id: string;
  order: number;
}

/**
 * @name useUpdateActions
 * @description Update an action data using an HTTP request to the
 * actions API endpoint.
 * @param organizationId;
 */
function useUpdateActions(organizationId: string) {
  const endpoint = `/api/actions/${organizationId}`;
  const fetcher = useApiRequest<void, UpdateActionsProps>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
      method: 'PUT',
    });
  });
}

export default useUpdateActions;
