import { useMemo, useState } from 'react';

import { Trans } from 'next-i18next';
import Link from 'next/link';

import Logo from 'public/assets/svg/LogoText.svg';

import {
  Cog8ToothIcon,
  ArrowLeftOnRectangleIcon,
  Squares2X2Icon,
  ChevronDownIcon,
  PaintBrushIcon,
  SunIcon,
  ComputerDesktopIcon,
  MoonIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/outline';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '~/core/ui/Dropdown';

import ProfileAvatar from './ProfileAvatar';
import configuration from '~/configuration';

import {
  setTheme,
  DARK_THEME_CLASSNAME,
  LIGHT_THEME_CLASSNAME,
  SYSTEM_THEME_CLASSNAME,
} from '~/core/theming';

import If from '~/core/ui/If';
import { destroyCookie } from 'nookies';
import Image from 'next/image';
import { IMPERSONATING_CLIENT_COOKIE } from '~/components/admin/users/ImpersonateUserModal';

const ProfileDropdown: React.FCC<{
  user: any;
  signOutRequested: () => void;
  isDemo?: boolean;
}> = ({ user, signOutRequested, isDemo = false }) => {
  const auth = user?.auth;

  const signedInAsLabel = useMemo(() => {
    return (
      auth?.email ??
      auth?.phoneNumber ?? <Trans i18nKey={'common:anonymousUser'} />
    );
  }, [auth]);

  const [email, setEmail] = useState(signedInAsLabel);
  const [name, setName] = useState(user?.data?.fullName);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={
          'flex cursor-pointer items-center space-x-2 focus:outline-none'
        }
      >
        <ProfileAvatar user={auth} />

        <ChevronDownIcon className={'h-4'} />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className={'!min-w-[15rem] shadow-xl lg:rounded-md'}
        collisionPadding={{ right: 20 }}
      >
        <If condition={!isDemo}>
          <DropdownMenuItem
            className={'!h-12 rounded-none py-0'}
            clickable={false}
          >
            <div
              className={
                'flex flex-col justify-start truncate text-left text-xs'
              }
            >
              <div className={'text-gray-500 dark:text-gray-400'}>
                Signed in as
              </div>

              <div>
                <span className={'block truncate'}>{email}</span>
              </div>
              <div>
                <span className={'block truncate'}>{name}</span>
              </div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Link
              href={configuration.paths.appHome}
              className={'flex h-full w-full items-center space-x-2'}
            >
              <Squares2X2Icon className={'h-5'} />
              <span>
                <Trans i18nKey={'common:dashboardTabLabel'} />
              </span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link
              href={configuration.paths.demo}
              className={'flex h-full w-full items-center space-x-2'}
            >
              <PlayCircleIcon className={'h-5'} />
              <span>
          Demo
              </span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link
              href={'/settings/profile'}
              className={'flex h-full w-full items-center space-x-2'}
            >
              <Cog8ToothIcon className={'h-5'} />
              <span>
                <Trans i18nKey={'common:settingsTabLabel'} />
              </span>
            </Link>
          </DropdownMenuItem>
        </If>
        <If condition={configuration.enableThemeSwitcher}>
          <ThemeSelectorSubMenu />
        </If>
        <If condition={!isDemo}>
          <DropdownMenuSeparator />
        </If>

        {!isDemo ? (
          <DropdownMenuItem
            role={'button'}
            onClick={() => {
              destroyCookie(undefined, 'session');
              destroyCookie(undefined, 'sessionExpiresAt');
              destroyCookie(undefined, IMPERSONATING_CLIENT_COOKIE, { path: '/' });
              signOutRequested();
            }}
            className={'flex !cursor-pointer items-center space-x-2'}
          >
            <ArrowLeftOnRectangleIcon className={'h-5'} />

            <span>
              <Trans i18nKey={'auth:signOut'} />
            </span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            role={'button'}
            className={'flex !cursor-pointer items-center space-x-2'}
          >
            <Link className='p-4' href={configuration.paths.signIn}>
              <Image alt="logo" width={170} src={Logo}></Image>
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

function ThemeSelectorSubMenu() {
  const Wrapper: React.FCC = ({ children }) => (
    <span className={'flex items-center space-x-2.5'}>{children}</span>
  );

  return (
    <>
      <DropdownMenuSeparator className={'hidden lg:flex'} />

      <DropdownMenuSub>
        <DropdownMenuSubTrigger className={'hidden lg:flex'}>
          <Wrapper>
            <PaintBrushIcon className={'h-5'} />

            <span>
              <Trans i18nKey={'common:theme'} />
            </span>
          </Wrapper>
        </DropdownMenuSubTrigger>

        <DropdownMenuSubContent>
          <DropdownMenuItem
            className={'cursor-pointer'}
            onClick={() => setTheme(LIGHT_THEME_CLASSNAME)}
          >
            <Wrapper>
              <SunIcon className={'h-4'} />

              <span>
                <Trans i18nKey={'common:lightTheme'} />
              </span>
            </Wrapper>
          </DropdownMenuItem>

          <DropdownMenuItem
            className={'cursor-pointer'}
            onClick={() => setTheme(DARK_THEME_CLASSNAME)}
          >
            <Wrapper>
              <MoonIcon className={'h-4'} />

              <span>
                <Trans i18nKey={'common:darkTheme'} />
              </span>
            </Wrapper>
          </DropdownMenuItem>

          <DropdownMenuItem
            className={'cursor-pointer'}
            onClick={() => setTheme(SYSTEM_THEME_CLASSNAME)}
          >
            <Wrapper>
              <ComputerDesktopIcon className={'h-4'} />

              <span>
                <Trans i18nKey={'common:systemTheme'} />
              </span>
            </Wrapper>
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    </>
  );
}

export default ProfileDropdown;
