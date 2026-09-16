import useSWRMutation from 'swr/mutation';
import { useApiRequest } from '~/core/hooks/use-api';
import { MembershipRole } from '../types/membership-role';

interface Invite {
  email: string;
  role: MembershipRole;
}

export function useInviteMembers(organizationId: string, teamId: string) {
  const endpoint = `/api/organizations/${organizationId}/invite?teamId=${teamId}`;
  const fetcher = useApiRequest<void, Invite[]>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: Invite[] }) => {
    return fetcher({
      path,
      body,
    });
  });
}
