import { useEffect, useMemo, useState } from 'react';
import { useAuth } from 'reactfire';

import dynamic from 'next/dynamic';
import Image from 'next/image';

import { useUserSession } from '~/core/hooks/use-user-session';
import If from '~/core/ui/If';

import ProfileDropdown from '~/components/ProfileDropdown';

import Logo from 'public/assets/svg/LogoText.svg';
import bell from 'public/assets/svg/bell.svg';
import mail from 'public/assets/svg/mail-orange.svg';

import OrganizationsSelector from '~/components/organizations/OrganizationsSelector';
import TeamsSelector from '~/components/organizations/TeamsSelector';
import NotificationSidebar from '~/components/board/sideBars/notificationSidebar';

import { useCurrentOrganization } from '~/lib/organizations/hooks/use-current-organization';
import { useFetchNotificationNumbers } from '~/lib/server/notifications/use-fetch-notification-numbers';
import ContactSidebar from '~/components/board/sideBars/contactSidebar';

import { useRouter } from 'next/router';
import DocsDropdown from '~/components/DocsDropdown';
import { useFetchDocs } from '~/lib/server/docs/get-Docs';

const MobileNavigation = dynamic(() => import('~/components/MobileNavigation'));

const AppHeaderNoMenu: React.FCC = ({ children }) => {
  const userSession = useUserSession();
  const auth = useAuth();
  const currentUser = auth.currentUser;

  const organization = useCurrentOrganization();
  const organizationId = organization?.id as string;

  const [showSidebar, setShowSideBar] = useState(false);
  const [showContactSidebar, setShowContactSideBar] = useState(false);
  const [totalNotificationNumber, setTotalNotificationNumber] = useState(0);

  const { data: docs } = useFetchDocs();

  const { totalNotifications } = useFetchNotificationNumbers(
    organizationId,
    currentUser?.email as string,
  );

  useEffect(() => {
    setTotalNotificationNumber(totalNotifications);
  }, [totalNotifications]);

  const router = useRouter();

  useEffect(() => {
    if (window.location.hash === '#contactus') {
      setShowContactSideBar(true);
    }
  }, [router.asPath]);

  return (
    <div className="flex items-center justify-between border-b border-gray-50 py-3 px-4">
      {(showSidebar || showContactSidebar) && (
        <div className="fixed top-0 left-0 w-full h-full bg-black opacity-20 z-10 pointer-events-auto "></div>
      )}
      <div className={'flex items-center '}>
        <div className={'flex items-center lg:hidden'}>
          <MobileNavigation />
        </div>

        <div className={'hidden md:flex items-center lg:space-x-4'}>
          <div className="flex">
            <Image alt="logo" width={107} src={Logo}></Image>
          </div>
        </div>
        <div className="md:flex">
          <div className={'flex w-full items-center ml-2  md:ml-12'}>
            <If condition={userSession?.auth?.uid}>
              {(uid) => <OrganizationsSelector userId={uid} />}
            </If>
          </div>

          <div className={'flex w-full items-center ml-2 my-2'}>
            <If condition={userSession?.auth?.uid}>
              {(uid) => <TeamsSelector userId={uid} />}
            </If>
          </div>
        </div>
      </div>

      <div className={'flex items-center justify-center space-x-4'}>
        <DocsDropdown docs={docs} />
        <button onClick={() => setShowContactSideBar(true)}>
          <div className="relative">
            <Image src={mail} alt="mail" className="w-8 h-8" />
          </div>
        </button>
        <button className="relative" onClick={() => setShowSideBar(true)}>
          <div>
            <Image src={bell} alt="bell" className="w-8 h-8" />
            {totalNotificationNumber > 0 && (
              <div className="absolute top-[-6px] right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {totalNotificationNumber}
              </div>
            )}
          </div>
        </button>

        <ProfileDropdown
          user={userSession}
          signOutRequested={() => auth.signOut()}
        />
      </div>
      {showSidebar && (
        <div className="absolute">
          <NotificationSidebar
            organizationId={organizationId}
            setShowSidebar={setShowSideBar}
            currentUser={auth.currentUser}
          />
        </div>
      )}
      {showContactSidebar && (
        <div className="absolute">
          <ContactSidebar
            organization={organization}
            setShowSidebar={setShowContactSideBar}
            currentUser={auth.currentUser}
          />
        </div>
      )}
    </div>
  );
};

export default AppHeaderNoMenu;
