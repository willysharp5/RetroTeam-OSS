import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface DetatchAllCommentsProps {
  organization: string;
  retrospectiveId: string;
}

/**
 * @name useDetatchAllDemoComments
 * @description Detatch all demo comments data using an HTTP request to the
 * comments API endpoint.
 * @param groupId;
 */
function useDetatchAllDemoComments(
  groupId: string,
) {
  const endpoint = `/api/demo/detatch-all-demo?groupId=${groupId}`;
  const fetcher = useApiRequest<void, DetatchAllCommentsProps>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
      method: 'DELETE',
    });
  });
}

export default useDetatchAllDemoComments;
