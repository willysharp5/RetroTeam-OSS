import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface useUpdateByOrganizationProps {
  organizationId: string;
  userId: string;
}

/**
 * @name useUpdateByOrganization
 * @description Update last update organization data using an HTTP request to the
 * Organization API endpoint.
 */
function useUpdateByOrganization(organization: string) {
  const endpoint = `/api/organizations/${organization}/update-by`;
  const fetcher = useApiRequest<void, useUpdateByOrganizationProps>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
      method: 'PUT'
    });
  });
}

export default useUpdateByOrganization;
