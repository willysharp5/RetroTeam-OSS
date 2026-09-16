import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface DeleteActionProps {
  organization: string;
  retrospectiveId: string;
}

/**
 * @name useDeleteAction
 * @description Delete action data using an HTTP request to the
 * board API endpoint.
 * @param organization;
 * @param retrospectiveId;
 * @param actionId;
 */
function useDeleteAction(
  organizationId: string,
  retrospectiveId: string,
  actionId: string,
) {
  const endpoint = `/api/board/${actionId}/delete-action?organizationId=${organizationId}&retrospectiveId=${retrospectiveId}`;
  const fetcher = useApiRequest<void, DeleteActionProps>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
      method: 'DELETE',
    });
  });
}

export default useDeleteAction;
