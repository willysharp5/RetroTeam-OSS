import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface AddAnonymousMemberToOrganizationTeamProps {
  // the code generated when creating the invitation
  code: string;
  userId: string;
}

/**
 * @name useAddAnonymousMemberToOrganizationTeam
 * @description Add a member to an organization team using an HTTP request to the
 * team API endpoint.
 * @param organizationId
 * @param teamId
 */
function useAddAnonymousMemberToOrganizationTeam(
  organizationId: string,
  teamId: string,
) {
  const endpoint = `/api/teams/${organizationId}/${teamId}/anonymous-members`;
  const fetcher = useApiRequest<
    void,
    AddAnonymousMemberToOrganizationTeamProps
  >();

  return useSWRMutation(
    endpoint,
    (
      path,
      { arg: body }: { arg: AddAnonymousMemberToOrganizationTeamProps },
    ) => {
      return fetcher({
        path,
        body,
      });
    },
  );
}

export default useAddAnonymousMemberToOrganizationTeam;
