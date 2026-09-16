import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface VoteGroupProps {
  votes: number;
  id: string;
  organizationId: string;
  retrospectiveId: string;
  userId: string;
  userVotes: number;
}

/**
 * @name useVoteGroup
 * @description Update a group vote data using an HTTP request to the
 * group API endpoint.
 */
function useVoteGroup() {
  const endpoint = `/api/board/vote`;
  const fetcher = useApiRequest<void, VoteGroupProps>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
      method: 'PUT',
    });
  });
}

export default useVoteGroup;
