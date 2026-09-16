import { GetServerSidePropsContext } from 'next';
import Link from 'next/link';
import Head from 'next/head';
import Image from 'next/image';

import { FormEvent, useCallback } from 'react';
import { Trans, useTranslation } from 'next-i18next';
import { useAuth } from 'reactfire';
import { sendPasswordResetEmail } from 'firebase/auth';

import { useRequestState } from '~/core/hooks/use-request-state';
import { getFirebaseErrorCode } from '~/core/firebase/utils/get-firebase-error-code';

import configuration from '~/configuration';

import { withAuthProps } from '~/lib/props/with-auth-props';
import AuthErrorMessage from '~/components/auth/AuthErrorMessage';
import AuthPageLayout from '~/components/auth/AuthPageLayout';

import Button from '~/core/ui/Button';
import TextField from '~/core/ui/TextField';
import If from '~/core/ui/If';
import Alert from '~/core/ui/Alert';

import people from '/public/assets/svg/people.svg';
import logo from '/public/assets/images/logo.png';

export const PasswordReset: React.FCC = () => {
  const auth = useAuth();
  const { state, setError, setData, setLoading } = useRequestState();
  const { t } = useTranslation();

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const data = new FormData(event.currentTarget);
      const email = data.get('email') as string;

      setLoading(true);

      try {
        const returnUrl = getReturnUrl();

        await sendPasswordResetEmail(auth, email, {
          url: returnUrl,
        });

        setData(true);
      } catch (e) {
        setError(getFirebaseErrorCode(e));
      }
    },
    [auth, setData, setError, setLoading],
  );

  return (
    <>
      <div className={'grid grid-cols-2 align-center text-white'}>
        <div className="bg-black p-10">
          <Link href={configuration.paths.authLogo as string} className="flex">
            <Image height={14} width={27} alt="logo" src={logo}></Image>
            <p className="text-white text-lg ml-2">RetroTeam</p>
          </Link>
          <div className="mt-[157px] my-10 py-2.5 ">
            <h1 className="w-3/4 text-4xl font-extrabold">
              Better retrospectives - less effort.
            </h1>
            <div className="h-px w-full mt-11 bg-[#E4E4E7]"></div>
            <p className="text-lg mt-5">
              RetroTeam helps me improve my team efficiency.
            </p>
            <p className="mt-4">Luke - Team Lead</p>
            <div className="flex py-2.5 mt-4">
              <Image alt="people" src={people}></Image>
              <div className="w-px h-10 mx-4 bg-[#E4E4E7] my-auto"></div>
              <p className="my-auto">Join thousands of teams using Retroteam</p>
            </div>
          </div>
        </div>
        <div>
          <div className="flex justify-end text-sm mt-4 mx-8">
            <p className="text-zinc-500 my-auto">Already have an account?</p>
            <Link
              href={'/auth/sign-in'}
              className="text-white bg-black hover:bg-gray-500 rounded-md shadow-sm py-2 px-4 ml-1.5"
            >
              Sign In
            </Link>
          </div>
          <AuthPageLayout
            heading={<Trans i18nKey={'auth:passwordResetLabel'} />}
          >
            <Head>
              <title key={'title'}>{t(`auth:passwordResetLabel`)}</title>
            </Head>

            <If condition={state.success}>
              <Alert type={'success'}>
                <Trans i18nKey={'auth:passwordResetSuccessMessage'} />
              </Alert>
            </If>

            <If condition={!state.data}>
              <>
                <form
                  onSubmit={(e) => void onSubmit(e)}
                  className={'container mx-auto flex justify-center'}
                >
                  <div className={'flex-col space-y-4'}>
                    <div>
                      <p
                        className={
                          'mt-[26px] text-xs text-gray-700 dark:text-gray-400'
                        }
                      >
                        <Trans i18nKey={'auth:passwordResetSubheading'} />
                      </p>
                    </div>

                    <div>
                      <TextField.Label>
                        <Trans i18nKey={'common:email'} />

                        <TextField.Input
                          name="email"
                          required
                          type="email"
                          placeholder={'your@email.com'}
                        />
                      </TextField.Label>
                    </div>

                    <If condition={state.error}>
                      <AuthErrorMessage error={state.error as string} />
                    </If>

                    <Button
                      className="w-full bg-rose-400 hover:bg-rose-300 active:bg-rose-500 focus:ring-rose-300 dark:focus:ring-rose-300"
                      loading={state.loading}
                      type="submit"
                      block
                    >
                      <Trans i18nKey={'auth:passwordResetLabel'} />
                    </Button>
                  </div>
                </form>
              </>
            </If>

            <div className={'flex justify-center text-xs'}>
              <p className={'flex space-x-1'}>
                <span>
                  <Trans i18nKey={'auth:passwordRecoveredQuestion'} />
                </span>
              </p>
            </div>
          </AuthPageLayout>
        </div>
      </div>
    </>
  );
};

export default PasswordReset;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  return await withAuthProps(ctx);
}

/**
 * @description
 * Return the URL where the user will be redirected to after resetting
 * their password. By default, we will redirect to the sign-in page
 */
function getReturnUrl() {
  return `${window.location.origin}${configuration.paths.signIn}`;
}
