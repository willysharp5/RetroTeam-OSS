import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

function useSearchUsers() {
  const endpoint = `/api/search/users`;
  const fetcher = useApiRequest<void>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
    });
  });
}

export default useSearchUsers;
