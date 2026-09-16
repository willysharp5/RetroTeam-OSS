import useSWR from 'swr';

interface AiStatus {
  configured: boolean;
  message: string | null;
}

/**
 * @name useAiStatus
 * @description Whether the install has an AI provider key. Used to show a
 * "add your own API key" notice instead of letting AI actions fail silently.
 *
 * This is a bring-your-own-key build: a missing key is a setup step, never an
 * entitlement, so there is nothing to upsell here.
 */
export function useAiStatus() {
  const { data, error, isLoading } = useSWR<AiStatus>(
    '/api/ai/status',
    async (path: string) => {
      const response = await fetch(path);

      if (!response.ok) {
        throw new Error(`Could not read the AI status: ${response.status}`);
      }

      return response.json();
    },
    {
      revalidateOnFocus: false,
    },
  );

  return {
    // Assume it is configured until we know otherwise, so the notice never
    // flashes on a healthy install.
    configured: data?.configured ?? true,
    message: data?.message ?? null,
    loading: isLoading,
    error,
  };
}

export default useAiStatus;
