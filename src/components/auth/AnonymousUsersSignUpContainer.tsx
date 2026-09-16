import { Fragment, useCallback, useEffect, useRef, useState } from 'react';

import { FirebaseError } from 'firebase/app';
import { User, sendEmailVerification } from 'firebase/auth';

import Image from 'next/image';

import Button from '~/core/ui/Button';
import { useSignUpAnonymousUsers } from '~/core/firebase/hooks/use-sign-up-anonymous';
import useCreateServerSideSession from '~/core/hooks/use-create-server-side-session';

import configuration from '~/configuration';

import eyeOff from '/public/assets/svg/eye-off.svg';

const requireEmailVerification = configuration.auth.requireEmailVerification;

const AnonymousUsersSignUpContainer: React.FCC<{
  onSignUp: (email: string, id: string) => unknown;
  onError?: (error: FirebaseError) => unknown;
  isInviting: boolean;
  enforceEmailVerification?: boolean;
  setLoading?: (loading: boolean) => void;
  name?: string;
  lastName?: string;
  setErrorForm?: (error: any) => void;
}> = ({
  onSignUp,
  onError,
  enforceEmailVerification = true,
  isInviting = false,
  setLoading,
  name,
  lastName,
  setErrorForm,
}) => {
  const [showVerifyEmailAlert, setShowVerifyEmailAlert] = useState(false);

  const sendEmailVerification = useSendEmailConfirmation();

  const [sessionRequest, sessionState] = useCreateServerSideSession();

  const [signUp, state] = useSignUpAnonymousUsers();

  const redirecting = useRef(false);

  const loading = state.loading || sessionState.loading || redirecting.current;

  const callOnErrorCallback = useCallback(() => {
    if (state.error && onError) {
      onError(state.error);
    }
  }, [state.error, onError]);

  const createSession = useCallback(
    async (user: User) => {
      // using the ID token, we will make a request to initiate the session
      // to make SSR possible via session cookie
      await sessionRequest(user);

      // if the user is required to verify their email, we display a message
      // in case it's an invite, we don't send the verification email
      if (requireEmailVerification && enforceEmailVerification) {
        await sendEmailVerification(user);

        setShowVerifyEmailAlert(true);
      } else {
        redirecting.current = true;
        // we notify the parent component that
        // the user signed up successfully, so they can be redirected
        onSignUp('', user.uid);
      }
    },
    [enforceEmailVerification, onSignUp, sendEmailVerification, sessionRequest],
  );

  useEffect(() => {
    callOnErrorCallback();
  }, [callOnErrorCallback]);

  const onSubmit = useCallback(
    async (params: {}) => {
      if (loading) {
        return;
      }

      if (isInviting && setErrorForm) {
        if (name === '' || lastName === '') {
          setErrorForm('Please enter First and Last Name');
          return;
        } else {
          setErrorForm(null);
        }
      }

      if (setLoading) {
        setLoading(true);
      }

      const credential = await signUp();

      if (credential) {
        await createSession(credential.user);
      }
    },
    [loading, signUp, createSession, setLoading, isInviting, lastName, name, setErrorForm],
  );

  return (
    <>
      {!isInviting ? (
        <button
          onClick={onSubmit}
          className="h-10  w-full flex text-gray-600 ring-primary-200 py-2 rounded-md text-sm text-[#18181B] font-medium
      ring-offset-1 transition-all hover:border-gray-300 hover:bg-gray-50
      focus:ring-2 bg-zinc-100 items-center justify-center"
        >
          <Image src={eyeOff} alt="anonimous"></Image>
          <p className="ml-2"> Sign in anonymously</p>
        </button>
      ) : (
        <Fragment>
          <Button
            onClick={onSubmit}
            className="flex w-full justify-center mt-[50px]"
            color={'secondary'}
          >
            Join
          </Button>
        </Fragment>
      )}
    </>
  );
};

export default AnonymousUsersSignUpContainer;

function useSendEmailConfirmation() {
  return useCallback((user: User) => {
    const fullPath = [
      configuration.site.siteUrl,
      configuration.paths.onboarding,
    ].join('/');

    return sendEmailVerification(user, {
      url: fullPath,
    });
  }, []);
}
