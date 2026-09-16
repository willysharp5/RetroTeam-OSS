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
 * @name useCreateDemoGroup
 * @description Add a demo group data using an HTTP request to the
 * Comments API endpoint.
 */
function useCreateDemoGroup() {
  const endpoint = `/api/demo/demo-grouping`;
  const fetcher = useApiRequest<void, CreateGroupProps>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
    });
  });
}

export default useCreateDemoGroup;
