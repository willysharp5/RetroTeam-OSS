import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

/**
 * @name useGetPatternsAdvice
 * @description Get patterns advice ai data using an HTTP request to the
 * Ai API endpoint.
 */
function useGetPatternsAdvice() {
    const endpoint = `/api/ai/get-patterns-advice`;
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

export default useGetPatternsAdvice;