import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface UpdateActionsProps {
  archive: boolean;
}

/**
 * @name useArchiveActions
 * @description Archive or Restore a board action data using an HTTP request to the
 * Board API endpoint.
 */
function useArchiveActions() {
  const endpoint = `/api/board/archive-action`;
  const fetcher = useApiRequest<void, UpdateActionsProps>();

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

export default useArchiveActions;
