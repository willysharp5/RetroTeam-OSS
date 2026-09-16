import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface UpdateGroupProps {
  id: string;
  name: string;
  organizationId: string;
  retrospectiveId: string;
  comments: any[];
  status: string;
}

/**
 * @name useUpdateDemoGroup
 * @description Update a demo group data using an HTTP request to the
 * group API endpoint.
 */
function useUpdateDemoGroup() {
  const endpoint = `/api/demo/demo-grouping`;
  const fetcher = useApiRequest<void, UpdateGroupProps>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
      method: 'PUT',
    });
  });
}

export default useUpdateDemoGroup;
