import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface DetatchAllCommentsProps {
  organization: string;
  retrospectiveId: string;
}

/**
 * @name useDetatchAllComments
 * @description Detatch all comments data using an HTTP request to the
 * comments API endpoint.
 * @param organization;
 * @param retrospectiveId;
 * @param groupId;
 */
function useDetatchAllComments(
  organizationId: string,
  retrospectiveId: string,
  groupId: string,
) {
  const endpoint = `/api/board/detatch-all?organizationId=${organizationId}&retrospectiveId=${retrospectiveId}&groupId=${groupId}`;
  const fetcher = useApiRequest<void, DetatchAllCommentsProps>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
      method: 'DELETE',
    });
  });
}

export default useDetatchAllComments;
