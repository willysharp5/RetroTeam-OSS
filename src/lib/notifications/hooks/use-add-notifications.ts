import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface AddNotificationsProps {
  category: string;
  email: string;
  organization: string;
  retrospectiveId: string;
  teamId: string;
  subtitle: string;
  title: string;
  type: string;
}

/**
 * @name useAddNotifications
 * @description Add a notifications data using an HTTP request to the
 * Notifications API endpoint.
 */
function useAddNotifications() {
  const endpoint = `/api/notifications/add-notifications`;
  const fetcher = useApiRequest<void, AddNotificationsProps>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
    });
  });
}

export default useAddNotifications;
