import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

/**
 * @name useDeleteAllNotificationByDate
 * @description Delete all notifications by date notification using an HTTP request
 */
function useDeleteAllNotificationByDate() {
  const endpoint = `/api/notifications/delete-all-by-date`;
  const fetcher = useApiRequest<void>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
      method: 'POST',
    });
  });
}

export default useDeleteAllNotificationByDate;
