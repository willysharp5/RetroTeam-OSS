import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface useEndRetrospectiveProps {
  description: string;
  assignee: string;
  organization: string;
  status: string;
  id: string;
  order: number;
}

/**
 * @name useEndRetrospective
 * @description End retrospective manually using an HTTP request to the
 * Retrospective API endpoint.
 */
function useEndRetrospective(
  organizationId: string,
  teamId: string,
  retrospectiveId: string,
) {
  const endpoint = `/api/board/end-retrospective?organizationId=${organizationId}&teamId=${teamId}&retrospectiveId=${retrospectiveId}`;
  const fetcher = useApiRequest<void, useEndRetrospectiveProps>();

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

export default useEndRetrospective;
