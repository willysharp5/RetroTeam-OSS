import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';

interface ContactFormProps {
  fullName: string;
  email: string;
  company: string;
  subject: string;
  message: string;
  organizationId: string;
  organizationName: string;
  internalEmail: string;
}

/**
 * @name useContactForm
 * @description Send email data using an HTTP request to the
 * contact API endpoint.
 */
function useContactForm() {
  const endpoint = `/api/contact`;
  const fetcher = useApiRequest<void, ContactFormProps>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
      method: 'POST',
    });
  });
}

export default useContactForm;
