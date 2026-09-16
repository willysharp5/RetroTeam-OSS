import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

/**
 * @name useDeleteDemoComments
 * @description Delete demo comments data using an HTTP request to the
 * comments API endpoint.
 * @param organization;
 * @param retrospectiveId;
 * @param commentId;
 */
function useDeleteDemoComments(
  commentId: string,
) {
  const endpoint = `/api/demo/${commentId}/delete`;
  const fetcher = useApiRequest<void>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
      method: 'DELETE',
    });
  });
}

export default useDeleteDemoComments;
