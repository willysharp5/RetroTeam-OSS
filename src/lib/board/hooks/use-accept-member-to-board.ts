import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface AddMemberToOrganizationProps {
  // the code generated when creating the invitation
  code: string;
}

/**
 * @name useAcceptMemberToBoard
 * @description Accept a member to a board using an HTTP request to the
 * board API endpoint.
 * @param id
 */
function useAcceptMemberToBoard(id: string) {
  const endpoint = `/api/board/${id}/accept`;
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

export default useAcceptMemberToBoard;
