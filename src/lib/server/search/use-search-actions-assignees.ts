import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface useSearchActionsAssigneesProps {
  name: string;
  userId: string;
  organization: string;
  team: string;
}

function useSearchActionsAssignees() {
  const endpoint = `/api/search/action-assignees`;
  const fetcher = useApiRequest<void, useSearchActionsAssigneesProps>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
    });
  });
}

export default useSearchActionsAssignees;
