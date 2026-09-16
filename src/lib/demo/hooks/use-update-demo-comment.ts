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
 * @name useUpdateDemoComments
 * @description Update a demo comment data using an HTTP request to the
 * board API endpoint.
 */
function useUpdateDemoComments() {
  const endpoint = `/api/demo/update-demo-comment`;
  const fetcher = useApiRequest<void, UpdateCommentsProps>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
      method: 'PUT',
    });
  });
}

export default useUpdateDemoComments;
