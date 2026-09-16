import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface AddUserDataProps {
  token: string;
  //lastName: string;
}

/**
 * @name useAddTokenUserData
 * @description Add a user data from a signed in token account using an HTTP request to the
 * users API endpoint.
 * @param id
 */
function useAddTokenUserData() {
  const endpoint = `/api/users/sign-in-token`;
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

export default useAddTokenUserData;