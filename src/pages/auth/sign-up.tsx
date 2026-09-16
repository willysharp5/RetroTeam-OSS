import { useCallback, useEffect, useState } from 'react';
import { useAuth } from 'reactfire';

import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { Trans, useTranslation } from 'next-i18next';

import configuration from '~/configuration';

import { withAuthProps } from '~/lib/props/with-auth-props';

import OAuthProviders from '~/components/auth/OAuthProviders';
import AnonymousUsersSignUpContainer from '~/components/auth/AnonymousUsersSignUpContainer';
import EmailPasswordSignUpContainer from '~/components/auth/EmailPasswordSignUpContainer';
import AuthPageLayout from '~/components/auth/AuthPageLayout';
import EmailLinkAuth from '~/components/auth/EmailLinkAuth';

import If from '~/core/ui/If';

import people from '/public/assets/svg/people.svg';
import logo from '/public/assets/images/logo.png';

import Cookies from 'js-cookie';
import useAddUserData from '~/lib/organizations/hooks/use-add-user-data';

const onboarding = configuration.paths.onboarding;

const SignUp: React.FCC = () => {
  const router = useRouter();
  const { t } = useTranslation();

  const auth = useAuth();
  const user = auth.currentUser;

  const { trigger: addUserData } = useAddUserData();

  const teamName = Cookies.get('teamInvite')
    ? atob(Cookies.get('teamInvite') as string)
    : '';

  const boardName = Cookies.get('boardInvite')
    ? atob(Cookies.get('boardInvite') as string)
    : '';

  const nameInvite = Cookies.get('nameInvite')
    ? atob(Cookies.get('nameInvite') as string)
    : '';

  const lastNameInvite = Cookies.get('lastNameInvite')
    ? atob(Cookies.get('lastNameInvite') as string)
    : '';

  const boardIdInvite = Cookies.get('boardIdInvite')
    ? atob(Cookies.get('boardIdInvite') as string)
    : '';

  const returnUrl = (router.query.returnUrl as string) || onboarding;

  const onSignUp = useCallback(
    (email: string, id: string) => {
      Cookies.remove('codeInvite');
      Cookies.remove('emailInvite');

      Cookies.remove('boardInvite');
      const Userbody = {
        name: nameInvite ? nameInvite : '',
        lastName: lastNameInvite ? lastNameInvite : '',
        email: email,
        id: id,
        createdAt: new Date().getTime(),
      };

      addUserData(Userbody)
        .then((res: any) => {
          if (res.success) {
            if (boardIdInvite) {
              Cookies.remove('boardIdInvite');
              return router.push(`/board/${boardIdInvite}`);
            }
            const path = returnUrl.startsWith('/')
              ? returnUrl
              : `/${returnUrl}`;
            return router.push(path.split('?')[0]);
          }
        })
        .catch((e) => {
          console.log('error', e);
        });
    },
    [router, addUserData, nameInvite, lastNameInvite, boardIdInvite, returnUrl],
  );

  useEffect(() => {
    void router.prefetch(onboarding);
  }, [router]);

  return (
    <>
      <div className={'md:grid grid-cols-2 align-center text-white'}>
        <div className="hidden md:block bg-[#FA6400] p-10">
          <Link href={configuration.paths.authLogo as string} className="flex">
            <Image height={14} width={27} alt="logo" src={logo}></Image>
            <p className="text-white text-lg ml-2">RetroTeam</p>
          </Link>
          <div className="mt-[157px] my-10 py-2.5 ">
            <h1 className="w-3/4 text-4xl font-extrabold">
              Set up in seconds and start running your retrospectives.
            </h1>
            <div className="h-px w-full mt-11 bg-[#E4E4E7]"></div>
            <p className="text-lg mt-5">
              “RetroTeam helps bring structure to my meetings, providing an easy
              platform to solicit feedback and, more importantly, follow up on
              action items after the fact”
            </p>
            <p className="mt-4">Dave - Engineering Manager</p>
            <div className="flex py-2.5 mt-4">
              <Image alt="people" src={people}></Image>
              <div className="w-px h-10 mx-4 bg-[#E4E4E7] my-auto"></div>
              <p className="my-auto">Join thousands of teams using Retroteam</p>
            </div>
          </div>
        </div>
        <div className="md:mx-0 mx-4">
          <div className="flex justify-end text-sm mt-4 mx-8">
            <p className="text-zinc-500 my-auto">Already have an account?</p>
            <Link
              href={
                returnUrl && returnUrl !== onboarding
                  ? `/auth/sign-in?returnUrl=${encodeURIComponent(returnUrl)}`
                  : '/auth/sign-in'
              }
              className="text-white bg-black hover:bg-gray-500 rounded-md shadow-sm py-2 px-4 ml-1.5"
            >
              Sign In
            </Link>
          </div>
          <AuthPageLayout heading={<Trans i18nKey={'auth:signUpHeading'} />}>
            <Head>
              <title key={'title'}>{t(`auth:signUp`)}</title>
            </Head>

            {!user && (
              <>
                <OAuthProviders onSignIn={onSignUp} />
                <AnonymousUsersSignUpContainer
                  isInviting={false}
                  onSignUp={onSignUp}
                ></AnonymousUsersSignUpContainer>
              </>
            )}

            <If condition={configuration.auth.providers.emailPassword}>
              {!user || user?.isAnonymous === false ? (
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
              ) : teamName ? (
                <div className="text-black w-full" style={{ marginBottom: 10 }}>
                  <p className={'text-sm  w-full text-center my-auto'}>
                    Please sign up in order to join the team
                    <br />
                    <b>{teamName}</b>
                  </p>
                  <p>Name</p>
                  <b>
                    {nameInvite} {lastNameInvite}
                  </b>
                </div>
              ) : (
                boardName && (
                  <div
                    className="text-black w-full"
                    style={{ marginBottom: 10 }}
                  >
                    <p className={'text-sm  w-full text-center my-auto'}>
                      Please sign up in order to join
                      <br />
                      <b>{boardName}</b>
                    </p>
                    <p>Name</p>
                    <b>
                      {nameInvite} {lastNameInvite}
                    </b>
                  </div>
                )
              )}

              <EmailPasswordSignUpContainer onSignUp={onSignUp} />
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
    </>
  );
};

export default SignUp;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  return await withAuthProps(ctx);
}
