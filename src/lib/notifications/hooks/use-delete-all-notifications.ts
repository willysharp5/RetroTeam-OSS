import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

/**
 * @name useDeleteAllNotificationByType
 * @description Delete all notifications by type notification using an HTTP request
 */
function useDeleteAllNotificationByType() {
  const endpoint = `/api/notifications/delete-all-by-type`;
  const fetcher = useApiRequest<void>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
      method: 'POST',
    });
  });
}

export default useDeleteAllNotificationByType;
