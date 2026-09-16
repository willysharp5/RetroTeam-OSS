import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface useDeleteBoardActionProps {
    retrospectiveId: string;
    id: string;
    organizationId: string;
}

/**
 * @name useDeleteBoardAction
 * @description Delete a board action data using an HTTP request to the
 * Board API endpoint.
 */
function useDeleteBoardAction() {
    const endpoint = `/api/board/delete-action`;
    const fetcher = useApiRequest<void, useDeleteBoardActionProps>();

    return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
        return fetcher({
            path,
            body,
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
        });
    });
}

export default useDeleteBoardAction;
