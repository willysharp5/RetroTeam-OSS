import React from 'react';
import { useUser } from 'reactfire';

import NavigationItem from '~/core/ui/Navigation/NavigationItem';
import NavigationMenu from '~/core/ui/Navigation/NavigationMenu';
import MobileNavigationDropdown from '~/core/ui/MobileNavigationMenu';
import If from '~/core/ui/If';

const links = {
  General: {
    path: '/settings/integration',
    label: 'Jira',
  },
};

const IntegrationSettingsTabs = () => {
  const { data: user } = useUser();

  const itemClassName = `flex justify-center lg:justify-start items-center w-full`;

  return (
    <>
      <If condition={!user?.isAnonymous}>
        <div className={'hidden w-[12rem] lg:flex pt-4 lg:pt-6 bg-gray-100'}>
          <NavigationMenu vertical pill>
            <NavigationItem
              className={itemClassName}
              link={links.General}
              depth={0}
            />
          </NavigationMenu>
        </div>

        <div className={'block w-full lg:hidden'}>
          <MobileNavigationDropdown links={Object.values(links)} />
        </div>
      </If>
    </>
  );
};

export default IntegrationSettingsTabs;
