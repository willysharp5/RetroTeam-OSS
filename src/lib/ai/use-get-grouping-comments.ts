import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

/**
 * @name useGetGroupingComments
 * @description Get grouping comments ai data using an HTTP request to the
 * Ai API endpoint.
 */
function useGetGroupingComments() {
    const endpoint = `/api/ai/get-grouping-comments`;
    const fetcher = useApiRequest<void>();

    return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
        return fetcher({
            path,
            body,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
    });
}

export default useGetGroupingComments;