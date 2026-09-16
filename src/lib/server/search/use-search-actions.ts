import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface useSearchActionsProps {
  name: string;
  userId: string;
  organization: string;
}

function useSearchActions() {
  const endpoint = `/api/search/actions`;
  const fetcher = useApiRequest<void, useSearchActionsProps>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
    });
  });
}

export default useSearchActions;
