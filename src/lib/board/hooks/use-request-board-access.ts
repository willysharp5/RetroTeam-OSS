import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface RequestBoardAccessProps {
  organization: string;
  userId: string;
  id: string;
}

/**
 * @name RequestBoardAccess
 * @description Add a comments data using an HTTP request to the
 * Comments API endpoint.
 */
function useRequestBoardAccess(id: string) {
  const endpoint = `/api/board/${id}/access`;
  const fetcher = useApiRequest<void, RequestBoardAccessProps>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
    });
  });
}

export default useRequestBoardAccess;
