import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface LinkUserDataProps {
  id: string;
  email: string;
}

/**
 * @name useAddMemberToOrganization
 * @description Add a user email using an HTTP request to the
 * users API endpoint.
 * @param id
 */
function useLinkUserData() {
  const endpoint = `/api/users/link-email`;
  const fetcher = useApiRequest<void, LinkUserDataProps>();

  return useSWRMutation(
    endpoint,
    (path, { arg: body }: { arg: LinkUserDataProps }) => {
      return fetcher({
        path,
        body,
        method: 'PUT',
      });
    },
  );
}

export default useLinkUserData;
