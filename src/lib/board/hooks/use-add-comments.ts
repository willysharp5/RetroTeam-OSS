import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface AddCommentsProps {
  description: string;
  assignee: string;
  organization: string;
  status: string;
  id: string;
  order: number;
}

/**
 * @name AddComments
 * @description Add a comments data using an HTTP request to the
 * Comments API endpoint.
 */
function AddComments() {
  const endpoint = `/api/board/add-comments`;
  const fetcher = useApiRequest<void, AddCommentsProps>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
    });
  });
}

export default AddComments;
