import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface CreateGroupProps {
  id: string;
  name: string;
  organizationId: string;
  retrospectiveId: string;
  comments: any[];
  status: string;
}

/**
 * @name useCreateGroup
 * @description Add a group data using an HTTP request to the
 * Comments API endpoint.
 */
function useCreateGroup() {
  const endpoint = `/api/board/grouping`;
  const fetcher = useApiRequest<void, CreateGroupProps>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
    });
  });
}

export default useCreateGroup;
