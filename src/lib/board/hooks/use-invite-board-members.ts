import useSWRMutation from 'swr/mutation';
import { useApiRequest } from '~/core/hooks/use-api';
import { MembershipRole } from '~/lib/organizations/types/membership-role';

interface Invite {
  email: string;
  role: MembershipRole;
}

export function useInviteBoardMembers(retrospectiveId: string) {
  const endpoint = `/api/board/${retrospectiveId}/invite`;
  const fetcher = useApiRequest<void, Invite[]>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: Invite[] }) => {
    return fetcher({
      path,
      body,
    });
  });
}
