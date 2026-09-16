import { useCallback, useEffect, useRef, useState } from 'react';
import { FirebaseError } from 'firebase/app';
import { User, sendEmailVerification } from 'firebase/auth';
import { Trans } from 'next-i18next';

import If from '~/core/ui/If';
import Alert from '~/core/ui/Alert';
import configuration from '~/configuration';

import { useSignUpWithEmailAndPassword } from '~/core/firebase/hooks';
import { getFirebaseErrorCode } from '~/core/firebase/utils/get-firebase-error-code';

import AuthErrorMessage from './AuthErrorMessage';
import useCreateServerSideSession from '~/core/hooks/use-create-server-side-session';
import EmailPasswordSignUpForm from '~/components/auth/EmailPasswordSignUpForm';

import Cookies from 'js-cookie';
import useLinkUserData from '~/lib/organizations/hooks/use-link-user-email';

const requireEmailVerification = configuration.auth.requireEmailVerification;

const EmailPasswordSignUpContainer: React.FCC<{
  onSignUp: (email: string, id:string) => unknown;
  onError?: (error: FirebaseError) => unknown;
  enforceEmailVerification?: boolean;
}> = ({ onSignUp, onError, enforceEmailVerification = true }) => {
  const [showVerifyEmailAlert, setShowVerifyEmailAlert] = useState(false);

  const sendEmailVerification = useSendEmailConfirmation();
  const [sessionRequest, sessionState] = useCreateServerSideSession();
  const [signUp, state, isAnonymous, error] = useSignUpWithEmailAndPassword();

  const [errorMessage, setErrorMessage] = useState<any>();

  useEffect(() => {
    if (error) {
      setErrorMessage(error);
    }
    if (state.error && onError) {
      onError(state.error);
      setErrorMessage(state.error);
    }
  }, [error, state.error]);

  const { trigger: linkUser } = useLinkUserData();

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
        onSignUp(user.email as string, user.uid);
      }
    },
    [enforceEmailVerification, onSignUp, sendEmailVerification, sessionRequest],
  );

  useEffect(() => {
    callOnErrorCallback();
  }, [callOnErrorCallback]);

  const onSubmit = useCallback(
    async (params: {
      email: string;
      password: string;
      rememberMe: boolean;
    }) => {
      if (loading) {
        return;
      }
      if (params.rememberMe) {
        Cookies.set('rememberMeEmail', params.email, { expires: 30 });
        Cookies.set('rememberMe', 'true', { expires: 30 });
      } else {
        Cookies.remove('rememberMeEmail');
        Cookies.remove('rememberMe');
      }
      let email = Cookies.get('emailInvite')
        ? atob(Cookies.get('emailInvite') as string)
        : params.email;
      const credential = await signUp(email, params.password);

      if (credential) {
        await createSession(credential.user);

        if (isAnonymous) {
          const id = credential?.user.uid as string;
          const Userbody = { email: email, id: id };
          linkUser(Userbody).catch((e: any) => {
            console.log('error', e);
          });
        }
      }
    },
    [loading, signUp, createSession, isAnonymous, linkUser],
  );

  return (
    <>
      <If condition={errorMessage}>
        {(error) => <AuthErrorMessage error={getFirebaseErrorCode(error)} />}
      </If>

      <If condition={showVerifyEmailAlert}>
        <VerifyEmailAlert />
      </If>

      <If condition={!showVerifyEmailAlert}>
        <EmailPasswordSignUpForm onSubmit={onSubmit} loading={loading} />
      </If>
    </>
  );
};

export default EmailPasswordSignUpContainer;

function VerifyEmailAlert() {
  return (
    <Alert type={'success'}>
      <Alert.Heading>
        <Trans i18nKey={'auth:emailConfirmationAlertHeading'} />
      </Alert.Heading>

      <p>
        <Trans i18nKey={'auth:emailConfirmationAlertBody'} />
      </p>
    </Alert>
  );
}

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
