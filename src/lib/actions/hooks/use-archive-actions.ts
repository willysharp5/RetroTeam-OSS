import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface ArchiveActionsProps {
  data: [
    {
      organization: string;
      archive: boolean;
      id: string;
    },
  ];
}

/**
 * @name useUpdateActions
 * @description Add a actions data using an HTTP request to the
 * actions API endpoint.
 * @param organizationId;
 */
function useArchiveActions(organizationId: string) {
  const endpoint = `/api/actions/${organizationId}`;
  const fetcher = useApiRequest<void, ArchiveActionsProps>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
      method: 'POST',
    });
  });
}

export default useArchiveActions;
