import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface DetatchCommentsProps {
  organization: string;
  retrospectiveId: string;
}

/**
 * @name useDetatchComments
 * @description Detatch comments data using an HTTP request to the
 * comments API endpoint.
 * @param organization;
 * @param retrospectiveId;
 * @param commentId;
 */
function useDetatchComments(
  organizationId: string,
  retrospectiveId: string,
  commentId: string,
  groupId: string,
) {
  const endpoint = `/api/board/${commentId}/detatch?organizationId=${organizationId}&retrospectiveId=${retrospectiveId}&groupId=${groupId}`;
  const fetcher = useApiRequest<void, DetatchCommentsProps>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
      method: 'DELETE',
    });
  });
}

export default useDetatchComments;
