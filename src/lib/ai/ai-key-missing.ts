/**
 * @name AI_KEY_MISSING_CODE
 * @description Sent by every AI endpoint when the install has no provider key,
 * alongside a 503 and a human-readable `error`. The code is what the UI matches
 * on: the wording of the message is free to change without breaking it.
 */
export const AI_KEY_MISSING_CODE = 'ai-key-missing';

/**
 * @name isAiKeyMissing
 * @description Whether a rejected AI request failed only because nobody has
 * supplied an API key yet.
 *
 * This build has no hosted key and no paid tier, so this is a setup step the
 * self-hoster can finish themselves — worth telling them plainly instead of
 * reporting it as a generic failure, which is what every AI screen used to do.
 *
 * `useApiRequest` rejects with the parsed response body, so the code arrives on
 * the caught value itself.
 */
export function isAiKeyMissing(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  return (error as { code?: string }).code === AI_KEY_MISSING_CODE;
}

/**
 * @name aiKeyMissingMessage
 * @description The endpoint's own explanation of what to do, when there is one.
 */
export function aiKeyMissingMessage(error: unknown): string | null {
  if (!isAiKeyMissing(error)) {
    return null;
  }

  const message = (error as { error?: unknown }).error;

  return typeof message === 'string' && message.length > 0 ? message : null;
}
