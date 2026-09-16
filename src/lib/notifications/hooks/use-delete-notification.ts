import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

/**
 * @name useDeleteNotification
 * @description Delete notification using an HTTP request
 */
function useDeleteNotification(id: string, organizationId: string) {
  const endpoint = `/api/notifications/${id}/delete?organizationId=${organizationId}`;
  const fetcher = useApiRequest<void>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
      method: 'DELETE',
    });
  });
}

export default useDeleteNotification;
