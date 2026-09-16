import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface Props {
  organizationId: string;
}

/**
 * @name useDeleteOrganization
 * @description Delete organization data using an HTTP request to the
 *  @param organizationId;
 * organization API endpoint.
 */
function useDeleteOrganization(organization: string) {
  const endpoint = `/api/organizations/${organization}/delete`;
  const fetcher = useApiRequest<void, Props>();
  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
      method: 'DELETE',
    });
  });
}

export default useDeleteOrganization;
