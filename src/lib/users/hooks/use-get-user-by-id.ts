import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface getUsersProps {
  userId: string;
}

/**
 * @name useFetchUserById
 * @description Fetch user by id using an HTTP request
 *  @param teamId;
 * users API endpoint.
 */
function useFetchUserById(
) {
  const endpoint = `/api/users/get-user-by-id`;
  const fetcher = useApiRequest<void, getUsersProps>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
      method: 'POST',
    });
  });
}

export default useFetchUserById;
