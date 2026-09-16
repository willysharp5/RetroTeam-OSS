import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface useDeleteActionProps {
    teamId: string;
    id: string;
    organizationId: string;
}

/**
 * @name useDeleteAction
 * @description Delete a organization action data using an HTTP request to the
 * Actions API endpoint.
 */
function useDeleteAction() {
    const endpoint = `/api/actions/delete-action`;
    const fetcher = useApiRequest<void, useDeleteActionProps>();

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

export default useDeleteAction;
