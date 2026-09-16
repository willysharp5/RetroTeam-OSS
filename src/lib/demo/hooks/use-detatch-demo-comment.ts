import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface DetatchCommentsProps {
  organization: string;
  retrospectiveId: string;
}

/**
 * @name useDetatchDemoComments
 * @description Detatch demo comments data using an HTTP request to the
 * comments API endpoint.
 * @param commentId;
 */
function useDetatchDemoComments(
  commentId: string,
  groupId: string,
) {
  const endpoint = `/api/demo/${commentId}/detatch-demo-comment?groupId=${groupId}`;
  const fetcher = useApiRequest<void, DetatchCommentsProps>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
      method: 'DELETE',
    });
  });
}

export default useDetatchDemoComments;
