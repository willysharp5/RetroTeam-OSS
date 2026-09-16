import useSWRMutation from 'swr/mutation';
import { useApiRequest } from '~/core/hooks/use-api';

interface Invite {
  email: string;
}

export function useInviteTeamMembers(organizationId: string, teamId: string) {
  const endpoint = `/api/teams/${organizationId}/${teamId}/invite`;
  const fetcher = useApiRequest<void, Invite[]>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: Invite[] }) => {
    return fetcher({
      path,
      body,
    });
  });
}
