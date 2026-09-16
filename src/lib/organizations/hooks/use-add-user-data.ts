import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface AddUserDataProps {
  name: string;
  lastName: string;
}

/**
 * @name useAddMemberToOrganization
 * @description Add a user data using an HTTP request to the
 * users API endpoint.
 * @param id
 */
function useAddUserData() {
  const endpoint = `/api/users`;
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

export default useAddUserData;
