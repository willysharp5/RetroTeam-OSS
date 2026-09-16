import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

/**
 * @name useGetAiActions
 * @description Get actions ai data using an HTTP request to the
 * Ai API endpoint.
 */
function useGetAiActions() {
    const endpoint = `/api/ai/get-ai-actions`;
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

export default useGetAiActions;