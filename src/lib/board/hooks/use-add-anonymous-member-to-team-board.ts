import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface AddAnonymousMemberToTeamBoardProps {
  // the code generated when creating the invitation
  code: string;
  userId: string;
  type: string;
  name: string;
  lastName: string;
}

/**
 * @name useAddAnonymousMemberToTeamBoard
 * @description Add a member to a team board using an HTTP request to the
 * board API endpoint.
 * @param id
 * @param organizationId
 * @param teamId
 */
function useAddAnonymousMemberToTeamBoard(
  boardId: string,
  organizationId: string,
  teamId: string,
) {
  const endpoint = `/api/board/${boardId}/anonymous-members?organizationId=${organizationId}&teamId=${teamId}`;
  const fetcher = useApiRequest<void, AddAnonymousMemberToTeamBoardProps>();

  return useSWRMutation(
    endpoint,
    (path, { arg: body }: { arg: AddAnonymousMemberToTeamBoardProps }) => {
      return fetcher({
        path,
        body,
      });
    },
  );
}

export default useAddAnonymousMemberToTeamBoard;
