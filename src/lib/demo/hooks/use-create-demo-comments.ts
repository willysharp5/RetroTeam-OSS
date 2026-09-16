import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface AddDemoCommentsProps {
  description: string;
  assignee: string;
  organization: string;
  status: string;
  id: string;
  order: number;
}

/**
 * @name useCreateDemoComments
 * @description Create demo comments data using an HTTP request to the
 * Comments API endpoint.
 */
function useCreateDemoComments() {
  const endpoint = `/api/demo/create-demo-comments`;
  const fetcher = useApiRequest<void, AddDemoCommentsProps>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
    });
  });
}

export default useCreateDemoComments;
