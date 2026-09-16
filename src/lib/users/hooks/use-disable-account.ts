import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface Props {
    userId: string;
}

/**
 * @name useDeleteOrganization
 * @description Disable user account data using an HTTP request to the
 *  @param userId;
 * User API endpoint.
 */
function useDisableAccount(userId: string, organizationId:string) {
  const endpoint = `/api/users/${userId}/disable-account?organizationId=${organizationId}`;
  const fetcher = useApiRequest<void, Props>();
  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
      method: 'DELETE',
    });
  });
}

export default useDisableAccount;
