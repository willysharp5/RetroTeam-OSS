import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface AddUserDataProps {
  name: string;
  lastName: string;
}

/**
 * @name useAddAnonymousUserData
 * @description Add a user data from an anonymous account using an HTTP request to the
 * users API endpoint.
 * @param id
 */
function useAddAnonymousUserData() {
  const endpoint = `/api/users/anonymous`;
  const fetcher = useApiRequest<void, AddUserDataProps>();

  return useSWRMutation(
    endpoint,
    (path, { arg: body }: { arg: AddUserDataProps }) => {
      return fetcher({
        path,
        body,
      });
    },
  );
}

export default useAddAnonymousUserData;
