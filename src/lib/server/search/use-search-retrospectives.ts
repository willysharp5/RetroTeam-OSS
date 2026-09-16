import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface useSearchRetrospectivesProps {
  name: string;
  userId: string;
  organization: string;
}

function useSearchRetrospectives() {
  const endpoint = `/api/search/retrospectives`;
  const fetcher = useApiRequest<void, useSearchRetrospectivesProps>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
    });
  });
}

export default useSearchRetrospectives;
