import { useAuth } from 'reactfire';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';

import { useUserSession } from '~/core/hooks/use-user-session';

import ProfileDropdown from '~/components/ProfileDropdown';

import Logo from '../../../../public/assets/svg/LogoText.svg';

import { useCurrentOrganization } from '~/lib/organizations/hooks/use-current-organization';

const MobileNavigation = dynamic(() => import('~/components/MobileNavigation'));

const ResultsHeader = () => {
  const userSession = useUserSession();
  const auth = useAuth();

  const organization = useCurrentOrganization();

  if (!organization) {
    return null;
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-3 px-4">
        <div className={'flex items-center '}>
          <div className={'flex items-center lg:hidden'}>
            <MobileNavigation />
          </div>

          <div className={'hidden md:flex items-center lg:space-x-4'}>
            <div className="flex">
              <Image alt="logo" width={207} src={Logo}></Image>
            </div>
          </div>

          <div className={'flex w-full items-center  ml-12'}>
            <Link href={'/dashboard'} className="text-sm">
              <p> Dashboard</p>
            </Link>
          </div>
        </div>
        <div className={'flex items-center justify-center space-x-4'}>
          <ProfileDropdown
             user={userSession}
            signOutRequested={() => auth.signOut()}
          />
        </div>
      </div>
    </>
  );
};

export default ResultsHeader;
