import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface Props {
  retrospectiveId: string;
}

/**
 * @name useMoveRetrospectiveMembers
 * @description Move retrospective members data using an HTTP request to the
 *  @param teamId;
 * retrospectives API endpoint.
 */
function useMoveRetrospectiveMembers(retrospectiveId: string) {
  const endpoint = `/api/retrospectives/${retrospectiveId}/move-members`;
  const fetcher = useApiRequest<void, Props>();
  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
    });
  });
}

export default useMoveRetrospectiveMembers;
