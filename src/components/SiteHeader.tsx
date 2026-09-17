import { useAuth } from 'reactfire';

import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { useUserSession } from '~/core/hooks/use-user-session';

import Logo from 'public/assets/svg/LogoText.svg';

import Button from '~/core/ui/Button';

import ProfileDropdown from './ProfileDropdown';

import configuration from '~/configuration';
import MobileNavigation from './MobileNavigation';
import Image from 'next/image';
import If from '~/core/ui/If';
import FirebaseFirestoreProvider from '~/core/firebase/components/FirebaseFirestoreProvider';

const SiteHeader: React.FCC<{
  fixed?: boolean;
}> = ({ fixed }) => {
  const auth = useAuth();
  const userSession = useUserSession();

  const signOutRequested = () => auth.signOut();

  return (
    <FirebaseFirestoreProvider>
      <div className="flex items-center justify-between border-b border-gray-50 py-3 px-4">
        <div className={'flex items-center '}>
          <div className={'flex items-center lg:hidden'}>
            <MobileNavigation />
          </div>

          <div className={'hidden md:flex items-center lg:space-x-4'}>
            <div className="flex">
              <Image alt="logo" width={120} src={Logo}></Image>
            </div>
          </div>
        </div>

        <If condition={userSession?.auth} fallback={<AuthButtons />}>
          <div className={'flex items-center justify-center space-x-4'}>
            <ProfileDropdown
              user={userSession}
              signOutRequested={signOutRequested}
            />
          </div>
        </If>
      </div>
    </FirebaseFirestoreProvider>
  );
};

function AuthButtons() {
  return (
    <div className={'hidden space-x-2 lg:flex'}>
      <Button round color={'secondary'} href={configuration.paths.signIn}>
        <span className={'flex items-center space-x-2'}>
          <span>Sign In</span>
          <ArrowRightIcon className={'h-4'} />
        </span>
      </Button>
    </div>
  );
}

export default SiteHeader;
