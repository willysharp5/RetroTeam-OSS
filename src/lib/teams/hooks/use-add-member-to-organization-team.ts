import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface AddMemberToOrganizationTeamProps {
  // the code generated when creating the invitation
  code: string;
}

/**
 * @name useAddMemberToOrganizationTeam
 * @description Add a member to an organization team using an HTTP request to the
 * member API endpoint.
 * @param id
 */
function useAddMemberToOrganizationTeam(
  organizationId: string,
  teamId: string,
) {
  const endpoint = `/api/teams/${organizationId}/${teamId}/members`;
  const fetcher = useApiRequest<void, AddMemberToOrganizationTeamProps>();

  return useSWRMutation(
    endpoint,
    (path, { arg: body }: { arg: AddMemberToOrganizationTeamProps }) => {
      return fetcher({
        path,
        body,
      });
    },
  );
}

export default useAddMemberToOrganizationTeam;
