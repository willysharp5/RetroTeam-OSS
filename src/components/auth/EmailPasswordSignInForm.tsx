import Link from 'next/link';
import { Trans } from 'next-i18next';
import { useForm } from 'react-hook-form';

import TextField from '~/core/ui/TextField';
import Button from '~/core/ui/Button';
import If from '~/core/ui/If';

import Cookies from 'js-cookie';
import { useState } from 'react';

const EmailPasswordSignInForm: React.FCC<{
  onSubmit: (params: {
    email: string;
    password: string;
    rememberMe: boolean;
  }) => unknown;

  loading: boolean;
}> = ({ onSubmit, loading }) => {
  const remember = Cookies.get('rememberMe') === 'true' || false;
  const emailRemember = Cookies.get('rememberMeEmail') || '';

  const [rememberMe, setRememberMe] = useState(remember);

  const { register, handleSubmit } = useForm({
    defaultValues: {
      email: emailRemember,
      password: '',
      rememberMe: rememberMe,
    },
  });

  const emailControl = register('email', { required: true });
  const passwordControl = register('password', { required: true });

  return (
    <form
      className={'w-full'}
      onSubmit={handleSubmit((data) => onSubmit({ ...data, rememberMe }))}
    >
      <div className={'flex-col space-y-4'}>
        <TextField>
          <TextField.Label>
            <Trans i18nKey={'common:email'} />

            <TextField.Input
              {...emailControl}
              data-cy={'email-input'}
              required
              type="email"
              placeholder={'your@email.com'}
            />
          </TextField.Label>
        </TextField>

        <TextField>
          <TextField.Label>
            <Trans i18nKey={'common:password'} />

            <TextField.Input
              {...passwordControl}
              required
              data-cy={'password-input'}
              type="password"
              placeholder={''}
            />
          </TextField.Label>
        </TextField>

        <div className="flex justify-between w-full">
          <div className="flex">
            <input
              checked={rememberMe}
              onChange={() => setRememberMe(!rememberMe)}
              type="checkbox"
            ></input>
            <p className="text-black text-sm ml-2.5">Remember Me</p>
          </div>
          <Link
            href={'/auth/password-reset'}
            className="text-[#EA580C] text-xs font-medium"
          >
            Forgot Password?
          </Link>
        </div>

        <div>
          <Button
            className={
              'w-full bg-rose-400 hover:bg-rose-300 active:bg-rose-500 focus:ring-rose-300'
            }
            color={'pink'}
            data-cy="auth-submit-button"
            type="submit"
            loading={loading}
          >
            <If
              condition={loading}
              fallback={<Trans i18nKey={'auth:signIn'} />}
            >
              <Trans i18nKey={'auth:signingIn'} />
            </If>
          </Button>
        </div>
      </div>
    </form>
  );
};

export default EmailPasswordSignInForm;
