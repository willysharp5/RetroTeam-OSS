import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect } from 'react';
import { useAuth } from 'reactfire';
import { useRouter } from 'next/router';
import { Trans, useTranslation } from 'next-i18next';
import If from '~/core/ui/If';

import configuration from '~/configuration';
import { isBrowser } from '~/core/generic/is-browser';
import getClientQueryParams from '~/core/generic/get-client-query-params';

import { withAuthProps } from '~/lib/props/with-auth-props';
import OAuthProviders from '~/components/auth/OAuthProviders';
import EmailPasswordSignInContainer from '~/components/auth/EmailPasswordSignInContainer';
import PhoneNumberSignInContainer from '~/components/auth/PhoneNumberSignInContainer';
import EmailLinkAuth from '~/components/auth/EmailLinkAuth';
import AuthPageLayout from '~/components/auth/AuthPageLayout';
import logo from '/public/assets/images/logo.png';
import AnonymousUsersSignUpContainer from '~/components/auth/AnonymousUsersSignUpContainer';

import FirebaseFirestoreProvider from '~/core/firebase/components/FirebaseFirestoreProvider';

const appHome = configuration.paths.appHome;

const FORCE_SIGN_OUT_QUERY_PARAM = 'signOut';
const NEEDS_EMAIL_VERIFICATION_QUERY_PARAM = 'needsEmailVerification';

export const SignInContent: React.FCC = () => {
  const router = useRouter();
  const auth = useAuth();
  const { t } = useTranslation();

  const shouldForceSignOut = useShouldSignOut();
  const shouldVerifyEmail = useShouldVerifyEmail();

  const returnUrl = (router.query.returnUrl as string) || appHome;

  const onSignIn = useCallback(async () => {
    const cleanPath = returnUrl.split('?')[0];
    return router.push(cleanPath);
  }, [router, returnUrl]);

  // let's prefetch the application home
  // to avoid slow redirects
  useEffect(() => {
    void router.prefetch(appHome);
  }, [router]);

  // force user signOut if the query parameter has been passed
  useEffect(() => {
    if (shouldForceSignOut) {
      void auth.signOut();
    }
  }, [auth, shouldForceSignOut]);

  return (
    <div className={'md:grid grid-cols-2 align-center text-white'}>
      <div className="hidden md:block bg-red-400 p-10">
        <Link href={configuration.paths.authLogo as string} className="flex">
          <Image height={14} width={27} alt="logo" src={logo}></Image>
          <p className="text-white text-lg ml-2">
            {configuration.site.siteName}
          </p>
        </Link>
        <div className="mt-[157px] my-10 py-2.5 ">
          <h1 className="text-4xl font-extrabold">
            It’s so simple to run<br></br> a retrospective using{' '}
            {configuration.site.siteName}.
          </h1>
          <div className="h-px w-full mt-11 bg-[#E4E4E7]"></div>
          <p className="text-lg mt-5">
            “Our retros now have more structure, are easier to follow, and
            <br /> involve less work.”
          </p>
          <p className="mt-4">Sofia - Product Manager</p>
        </div>
      </div>
      <div className="md:mx-0 mx-4">
        <div className="flex justify-end text-sm mt-4 mx-8">
          <p className="text-zinc-500 my-auto">Do not have an account?</p>
          <Link
            href={'/auth/sign-up'}
            className="text-black bg-[#EF4444] hover:bg-red-600 text-white rounded-md shadow-sm py-2 px-4 ml-1.5"
          >
            Sign Up
          </Link>
        </div>
        <AuthPageLayout heading={<Trans i18nKey={'auth:signInHeading'} />}>
          <Head>
            <title key={'title'}>{t(`auth:signUp`)}</title>
          </Head>

          <OAuthProviders onSignIn={onSignIn} />
          <AnonymousUsersSignUpContainer
            isInviting={false}
            onSignUp={onSignIn}
          ></AnonymousUsersSignUpContainer>

          <If condition={configuration.auth.providers.emailPassword}>
            <div className="flex w-full" style={{ marginBottom: 20 }}>
              <div className="bg-[#E4E4E7] h-px w-[156px] my-auto"></div>
              <p
                className={
                  'text-xs text-gray-400 uppercase w-full text-center my-auto'
                }
              >
                <Trans i18nKey={'auth:orContinueWith'} />
              </p>
              <div className="bg-[#E4E4E7] h-px w-[156px] my-auto"></div>
            </div>

            <EmailPasswordSignInContainer
              shouldVerifyEmail={shouldVerifyEmail}
              onSignIn={onSignIn}
            />
          </If>

          <If condition={configuration.auth.providers.phoneNumber}>
            <PhoneNumberSignInContainer onSignIn={onSignIn} />
          </If>

          <If condition={configuration.auth.providers.emailLink}>
            <EmailLinkAuth />
          </If>

          <p className="text-zinc-500 text-sm m-6">
            By clicking get started, you agree to our{' '}
            <a className="underline">Terms of Service</a> and{' '}
            <a className="underline">Privacy Policy</a>.
          </p>
        </AuthPageLayout>{' '}
      </div>
    </div>
  );
};

export const SignIn: React.FCC = () => {
  return (
    <FirebaseFirestoreProvider>
      <SignInContent />
    </FirebaseFirestoreProvider>
  );
};

export default SignIn;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  return await withAuthProps(ctx);
}

function useShouldSignOut() {
  return useQueryParam(FORCE_SIGN_OUT_QUERY_PARAM) === 'true';
}

function useShouldVerifyEmail() {
  return useQueryParam(NEEDS_EMAIL_VERIFICATION_QUERY_PARAM) === 'true';
}

function useQueryParam(param: string) {
  if (!isBrowser()) {
    return null;
  }

  const params = getClientQueryParams();

  return params.get(param);
}
