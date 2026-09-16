import { useMemo } from 'react';

import NavigationItem from '~/core/ui/Navigation/NavigationItem';
import NavigationMenu from '~/core/ui/Navigation/NavigationMenu';
import MobileNavigationDropdown from '~/core/ui/MobileNavigationMenu';
import If from '~/core/ui/If';
import { useAuth } from 'reactfire';

const links = {
  Teams: {
    path: '/settings/teams',
    label: 'General',
  },
};

const TeamsSettingsTabs = () => {
  const itemClassName = `flex justify-center lg:justify-start items-center w-full`;
  const auth = useAuth();
  const currentUser = auth.currentUser;
  return (
    <>
      <If condition={!currentUser?.isAnonymous && currentUser?.email}>
        <div
          className={'pt-4 lg:pt-6 hidden h-auto bg-gray-100 w-[12rem] lg:flex'}
        >
          <NavigationMenu vertical pill>
            <NavigationItem className={itemClassName} link={links.Teams} />
          </NavigationMenu>
        </div>

        <div className={'block w-full lg:hidden'}>
          <MobileTabs />
        </div>
      </If>
    </>
  );
};

function MobileTabs() {
  const items = useMemo(() => Object.values(links), []);

  return <MobileNavigationDropdown links={items} />;
}

export default TeamsSettingsTabs;
