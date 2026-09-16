import { Trans, useTranslation } from 'next-i18next';
import { useForm } from 'react-hook-form';

import TextField from '~/core/ui/TextField';
import Button from '~/core/ui/Button';
import If from '~/core/ui/If';

import Cookies from 'js-cookie';
import { useState } from 'react';
import LoadingMembersSpinner from '../organizations/LoadingMembersSpinner';

const EmailPasswordSignUpForm: React.FCC<{
  onSubmit: (params: {
    email: string;
    password: string;
    rememberMe: boolean;
  }) => unknown;

  loading: boolean;
}> = ({ onSubmit, loading }) => {
  const remember = Cookies.get('rememberMe') === 'true' || false;
  const emailRemember = Cookies.get('rememberMeEmail') || '';

  const { t } = useTranslation();

  const [rememberMe, setRememberMe] = useState(remember);

  const { register, handleSubmit, watch, formState } = useForm({
    defaultValues: {
      email: emailRemember,
      password: '',
      repeatPassword: '',
      rememberMe: false,
    },
  });
  const errors = formState.errors;
  const emailInvite =
    Cookies.get('emailInvite') && atob(Cookies.get('emailInvite') as string);

  let emailControl = register('email', { required: true });
  if (emailInvite) {
    emailControl = register('email', {
      required: true,
      value: emailInvite,
      disabled: true,
    });
  }

  const passwordControl = register('password', {
    required: true,
    minLength: {
      value: 6,
      message: t(`auth:passwordLengthError`),
    },
  });

  return (
    <form
      className={'w-full'}
      onSubmit={handleSubmit((data) => onSubmit({ ...data, rememberMe }))}
    >
      <div className={'flex-col space-y-8'}>
        {!loading ? (
          <>
            <TextField>
              <TextField.Label>
                <Trans i18nKey={'common:email'} />

                {!emailInvite ? (
                  <TextField.Input
                    {...emailControl}
                    data-cy={'email-input'}
                    required
                    type="email"
                    value={emailInvite}
                    placeholder={'your@email.com'}
                  />
                ) : (
                  <p>
                    <b>{emailInvite}</b>
                  </p>
                )}

                <TextField.Error error={errors.email?.message} />
              </TextField.Label>
            </TextField>

            <TextField>
              <TextField.Label>
                <Trans i18nKey={'common:password'} />

                <TextField.Input
                  {...passwordControl}
                  data-cy={'password-input'}
                  required
                  type="password"
                  placeholder={'at least 6 characters'}
                />

                <TextField.Error error={errors.password?.message} />
              </TextField.Label>
            </TextField>

            <div className="flex justify-between w-full">
              <div className="flex">
                <input
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  data-cy={'rememberMe-input'}
                  type="checkbox"
                ></input>
                <p className="text-black text-sm ml-2.5">Remember Me</p>
              </div>
            </div>
          </>
        ) : (
          <div className="m-auto w-full">
            <LoadingMembersSpinner>
              <p className="text-black">Creating account...</p>
            </LoadingMembersSpinner>
          </div>
        )}

        <div>
          <Button
            data-cy={'auth-submit-button'}
            className={'w-full'}
            color={'pink'}
            type="submit"
            loading={loading}
          >
            <If
              condition={loading}
              fallback={<Trans i18nKey={'auth:getStarted'} />}
            >
              <Trans i18nKey={'auth:signingUp'} />
            </If>
          </Button>
        </div>
      </div>
    </form>
  );
};

export default EmailPasswordSignUpForm;
