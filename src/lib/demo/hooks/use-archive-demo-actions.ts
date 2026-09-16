import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface useArchiveDemoActionsProps {
  archive: boolean;
}

/**
 * @name useArchiveDemoActions
 * @description Archive or Restore a board action data using an HTTP request to the
 * Board API endpoint.
 */
function useArchiveDemoActions() {
  const endpoint = `/api/demo/archive-demo-action`;
  const fetcher = useApiRequest<void, useArchiveDemoActionsProps>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });
}

export default useArchiveDemoActions;
