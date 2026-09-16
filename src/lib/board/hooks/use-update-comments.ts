import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface UpdateCommentsProps {
  description: string;
  assignee: string;
  organization: string;
  team: string;
  retrospective: string;
  board: string;
  status: string;
  id: string;
  order: number;
}

/**
 * @name useUpdateComments
 * @description Update a comment data using an HTTP request to the
 * board API endpoint.
 */
function useUpdateComments() {
  const endpoint = `/api/board/comments`;
  const fetcher = useApiRequest<void, UpdateCommentsProps>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
      method: 'PUT',
    });
  });
}

export default useUpdateComments;
