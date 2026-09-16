import { useCallback } from 'react';

import { useAuth } from 'reactfire';
import { FirebaseError } from 'firebase/app';
import type { UserCredential } from 'firebase/auth';

import { useRequestState } from '../../hooks/use-request-state';

export function useSignUpAnonymousUsers() {
  const auth = useAuth();

  const { state, setLoading, setData, setError } = useRequestState<
    UserCredential,
    FirebaseError
  >();

  const signUp = useCallback(async () => {
    setLoading(true);

    try {
      const { signInAnonymously } = await import('firebase/auth');

      const credential = await signInAnonymously(auth);

      setData(credential);

      return credential;
    } catch (error) {
      setError(error as FirebaseError);
      console.log('firebase error', error);
    }
  }, [auth, setData, setError, setLoading]);

  return [signUp, state] as [typeof signUp, typeof state];
}
