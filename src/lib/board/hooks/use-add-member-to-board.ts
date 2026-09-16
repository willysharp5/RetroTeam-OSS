import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface AddMemberToOrganizationProps {
  // the code generated when creating the invitation
  code: string;
  type: string;
  name: string;
  lastName: string;
  retrospectiveId: string;
  teamId: string;
  userId?: string;
}

/**
 * @name useAddMemberToBoard
 * @description Add a member to a board using an HTTP request to the
 * board API endpoint.
 * @param id
 */
function useAddMemberToBoard(id: string) {
  const endpoint = `/api/board/${id}/members`;
  const fetcher = useApiRequest<void, AddMemberToOrganizationProps>();

  return useSWRMutation(
    endpoint,
    (path, { arg: body }: { arg: AddMemberToOrganizationProps }) => {
      return fetcher({
        path,
        body,
      });
    },
  );
}

export default useAddMemberToBoard;
