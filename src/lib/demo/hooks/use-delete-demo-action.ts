import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

/**
 * @description Delete demo action data using an HTTP request to the
 * board API endpoint.
 * @param actionId;
 */
function useDeleteDemoAction(
  actionId: string,
) {
  const endpoint = `/api/demo/${actionId}/delete-demo-action`;
  const fetcher = useApiRequest<void>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
      method: 'PUT',
    });
  });
}

export default useDeleteDemoAction;
