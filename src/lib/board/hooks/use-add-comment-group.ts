import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';
import { Task } from '~/lib/actions/types/actions';

interface useAddCommentGroupProps {
  id: string;
  name: string;
  organizationId: string;
  retrospectiveId: string;
  comments: Task;
  status: string;
  votes: number;
  voters: any;
}

/**
 * @name useAddCommentGroup
 * @description Add a comment to a group data using an HTTP request to the
 * Group API endpoint.
 */
function useAddCommentGroup() {
  const endpoint = `/api/board/add-to-group`;
  const fetcher = useApiRequest<void, useAddCommentGroupProps>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
    });
  });
}

export default useAddCommentGroup;
