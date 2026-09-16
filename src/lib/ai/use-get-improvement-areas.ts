import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

/**
 * @name useGetImprovementAreas
 * @description Get imporvement areas project manager data using an HTTP request to the
 * Ai API endpoint.
 */
function useGetImprovementAreas() {
    const endpoint = `/api/ai/get-improvement-areas-project-manager`;
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

export default useGetImprovementAreas;