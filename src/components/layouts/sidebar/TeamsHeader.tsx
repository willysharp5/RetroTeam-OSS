import { useMemo } from 'react';
import { useAuth } from 'reactfire';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useUserSession } from '~/core/hooks/use-user-session';
import ProfileDropdown from '~/components/ProfileDropdown';
import Logo from '../../../../public/assets/svg/LogoText.svg';
import bell from 'public/assets/svg/bell.svg';
import { useCurrentOrganization } from '~/lib/organizations/hooks/use-current-organization';
import Link from 'next/link';
import OrganizationsSelector from '~/components/organizations/OrganizationsSelector';
import TeamsSelector from '~/components/organizations/TeamsSelector';

const MobileNavigation = dynamic(() => import('~/components/MobileNavigation'));

const TeamsHeader: React.FCC = ({ title }) => {
  const userSession = useUserSession();
  const auth = useAuth();

  const organization = useCurrentOrganization();

  const OrganizationsDropdown = useMemo(() => {
    const user = userSession?.auth;
    const userId = user?.uid;

    if (!userId) {
      return null;
    }

    return <OrganizationsSelector userId={userId} />;
  }, [userSession?.auth]);

  const TeamsDropdown = useMemo(() => {
    const user = userSession?.auth;
    const userId = user?.uid;

    if (!userId) {
      return null;
    }

    return <TeamsSelector userId={userId} />;
  }, [userSession?.auth]);

  if (!organization) {
    return null;
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-gray-50 ">
        <div className="md:flex md:space-x-6 space-y-6 md:space-y-0 py-5 px-4">
          <div className={'flex items-center space-x-6'}>
            <div className={'flex items-center lg:hidden'}>
              <MobileNavigation />
            </div>

            <Link
              href={'/dashboard'}
              className={'w-full hidden md:flex items-center lg:space-x-4'}
            >
              <div className="flex">
                <Image alt="logo" width={107} src={Logo}></Image>
              </div>
            </Link>
          </div>

          <div
            className={
              'md:flex flex-1 items-center md:space-x-2 space-y-4 md:space-y-0 w-full'
            }
          >
            <div>{OrganizationsDropdown}</div>
            <div>{TeamsDropdown}</div>
          </div>
        </div>

        <div className={'flex items-center justify-center space-x-4'}>
          <Image src={bell} alt="bell"></Image>
          <ProfileDropdown
            user={userSession}
            signOutRequested={() => auth.signOut()}
          />
        </div>
      </div>
    </>
  );
};

export default TeamsHeader;
