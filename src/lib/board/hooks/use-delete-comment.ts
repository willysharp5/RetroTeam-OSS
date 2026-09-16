import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface DeleteCommentsProps {
  organization: string;
  retrospectiveId: string;
}

/**
 * @name useDeleteComments
 * @description Delete comments data using an HTTP request to the
 * comments API endpoint.
 * @param organization;
 * @param retrospectiveId;
 * @param commentId;
 */
function useDeleteComments(
  organizationId: string,
  retrospectiveId: string,
  commentId: string,
) {
  const endpoint = `/api/board/${commentId}/delete?organizationId=${organizationId}&retrospectiveId=${retrospectiveId}`;
  const fetcher = useApiRequest<void, DeleteCommentsProps>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
      method: 'DELETE',
    });
  });
}

export default useDeleteComments;
