import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface useSearchRetrospectivesCreatorsProps {
  name: string;
  userId: string;
  organization: string;
}

function useSearchRetrospectivesCreators() {
  const endpoint = `/api/search/retrospective-creators`;
  const fetcher = useApiRequest<void, useSearchRetrospectivesCreatorsProps>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
    });
  });
}

export default useSearchRetrospectivesCreators;
