import { useMemo } from 'react';

import NavigationItem from '~/core/ui/Navigation/NavigationItem';
import NavigationMenu from '~/core/ui/Navigation/NavigationMenu';
import MobileNavigationDropdown from '~/core/ui/MobileNavigationMenu';
import If from '~/core/ui/If';

const links = {
  General: {
    path: '/settings/organization',
    label: 'organization:generalTabLabel',
  },
  Members: {
    path: '/settings/organization/members',
    label: 'organization:membersTabLabel',
  },
};

const OrganizationSettingsTabs = ({ isAnonymous }: any) => {
  const itemClassName = `flex justify-center lg:justify-start items-center w-full`;

  return (
    <>
      <If condition={!isAnonymous}>
        <div
          className={'hidden w-[12rem] lg:flex pt-4 lg:pt-6 bg-gray-100 h-auto'}
        >
          <NavigationMenu vertical pill>
            <NavigationItem
              className={itemClassName}
              link={links.General}
              depth={0}
            />

            <NavigationItem className={itemClassName} link={links.Members} />
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

export default OrganizationSettingsTabs;
