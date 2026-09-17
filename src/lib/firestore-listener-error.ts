import type { FirestoreError } from 'firebase/firestore';

/**
 * @name onListenerError
 * @description Builds the error callback for an `onSnapshot` listener.
 *
 * The error callback is optional in the Firestore SDK, and leaving it out is
 * not harmless: a listener that fails with no error callback rethrows the
 * failure out of the SDK as an uncaught error ("Uncaught Error in snapshot
 * listener"), which in development is a full-page Next.js overlay and in
 * production takes the whole route down. Wrapping the `onSnapshot` call in
 * `try`/`catch` does not help, because the failure arrives asynchronously long
 * after the call returned.
 *
 * There is nothing to retry, either — a listener denied once never recovers,
 * even after the user signs in — so the useful behaviour is to report the
 * failure, stop the spinner, and let the screen render whatever it has.
 *
 * Pass the result as the third argument to every `onSnapshot` call:
 *
 *     onSnapshot(query, (snapshot) => { ... },
 *       onListenerError('comments', { setError, setLoading }));
 *
 * @param context what was being listened to, for the console message
 * @param handlers the hook's own state setters, when it has them
 */
export function onListenerError(
  context: string,
  handlers: {
    setError?: (error: FirestoreError) => void;
    setLoading?: (loading: boolean) => void;
  } = {},
) {
  return (error: FirestoreError) => {
    console.error(`Firestore listener failed (${context}):`, error);

    handlers.setError?.(error);
    handlers.setLoading?.(false);
  };
}
