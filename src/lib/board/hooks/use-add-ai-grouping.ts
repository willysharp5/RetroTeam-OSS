import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface AddAiGroupingProps {
  organization: string;
  retrospectiveId: string;
}

/**
 * @name AddAIGrouping
 * @description Add a grouping AI data using an HTTP request to the
 * ai grouping API endpoint.
 */
function AddAIGrouping() {
  const endpoint = `/api/board/add-ai-grouping`;
  const fetcher = useApiRequest<void, AddAiGroupingProps>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
    });
  });
}

export default AddAIGrouping;
