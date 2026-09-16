import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

/**
 * @name useAddMemberToOrganizationByDomain
 * @description Add a member to an organization using an HTTP request to the
 * member API endpoint.
 * @param id
 */
function useAddMemberToOrganizationByDomain() {
  const endpoint = `/api/organizations/add-member`;
  const fetcher = useApiRequest<void>();

  return useSWRMutation(
    endpoint,
    (path, { arg: body }) => {
      return fetcher({
        path,
        body,
      });
    },
  );
}

export default useAddMemberToOrganizationByDomain;
