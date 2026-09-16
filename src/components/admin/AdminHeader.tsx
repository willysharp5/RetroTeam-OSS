import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import Logo from 'public/assets/svg/LogoText.svg';
import ProfileDropdown from '../ProfileDropdown';
import { useUserSession } from '~/core/hooks/use-user-session';
import { useAuth } from 'reactfire';
import ChevronRightIcon from '@heroicons/react/24/outline/ChevronRightIcon';
import { useRouter } from 'next/router';
import If from '~/core/ui/If';
import AdminMobileNavigation from '../AdminMobileNavigation';
import { useCallback, useMemo } from 'react';

function AdminHeader({ children }: React.PropsWithChildren) {
  const userSession = useUserSession();
  const auth = useAuth();

  const router = useRouter();

  const signOutRequested = useCallback(() => {
    auth.signOut();
    router.push(`auth/sign-in`);
  }, [auth, router]);



  return (
    <div className="flex items-center justify-between border-b border-gray-50 w-full">
      <div className="flex w-full space-y-2 md:space-y-0 flex-col md:flex-row items-center justify-start md:justify-between py-3 px-4">
        <div className="flex items-center w-full">
          <div className="flex items-center lg:hidden">
            <AdminMobileNavigation />
            <div className="flex w-full items-center ml-12">
              <Link
                href="/dashboard"
                className="border space-x-2 rounded hover:bg-gray-800 flex bg-black text-white py-2 px-4"
              >
                <ArrowLeftIcon className={'w-4 h-4'} />
                <p className="text-sm">Dashboard</p>
              </Link>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex">
              <Image alt="logo" width={207} src={Logo}></Image>
            </div>
            <div className="flex w-full items-center ml-12">
              <Link
                href="/dashboard"
                className="border space-x-2 rounded hover:bg-gray-800 flex bg-black text-white py-2 px-4"
              >
                <ArrowLeftIcon className={'w-4 h-4'} />
                <p className="text-sm">Dashboard</p>
              </Link>
            </div>
            <Breadcrumbs />
          </div>
        </div>
        <div className="hidden md:flex md:justify-end w-full space-x-4">
          <ProfileDropdown
            user={userSession}
            signOutRequested={signOutRequested}
          />
        </div>
      </div>
    </div>
  );
}

export function Breadcrumbs() {
  const router = useRouter();
  const { id } = router.query;
  const path = router.asPath;

  return (
    <div className={'flex space-x-2 items-center p-2 text-xs'}>
      <div className={'flex space-x-1.5 items-center'}>
        <Link href={'/admin'}>Admin</Link>
      </div>
      <If condition={path.startsWith('/admin/organizations')}>
        <ChevronRightIcon className={'w-3'} />

        <Link href={'/admin/organizations'}>Organizations</Link>
      </If>

      <If condition={path.startsWith('/admin/organizations') && id}>
        <ChevronRightIcon className={'w-3'} />

        <span>Members</span>
      </If>

      <If condition={path.startsWith('/admin/users')}>
        <ChevronRightIcon className={'w-3'} />

        <Link href={'/admin/users'}>Users</Link>
      </If>

      <If condition={path.startsWith('/admin/users') && id}>
        <ChevronRightIcon className={'w-3'} />

        <span>{id}</span>
      </If>
    </div>
  );
}

export default AdminHeader;
