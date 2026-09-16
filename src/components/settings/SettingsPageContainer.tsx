import React from 'react';

import Image from 'next/image';

import RouteShell from '~/components/RouteShell';

import NavigationMenu from '~/core/ui/Navigation/NavigationMenu';
import NavigationItem from '~/core/ui/Navigation/NavigationItem';

import settings from 'public/assets/svg/settings.svg';

const links = [
  {
    path: '/settings/profile',
    i18n: 'common:profileSettingsTabLabel',
  },
  {
    path: '/settings/teams',
    i18n: 'common:teamsTabLabel',
  },
  {
    path: '/settings/organization',
    i18n: 'common:organizationSettingsTabLabel',
  },
  {
    path: '/settings/integration',
    i18n: 'common:integrationSettingsTabLabel',
  },
];

const SettingsPageContainer: React.FCC<{
  title: string;
}> = ({ children, title }) => {
  return (
    <RouteShell title={title}>
      <div className="md:flex items-center justify-between border-b pb-2 border-gray-100 px-8 py-6 pb-0 tv:px-36 bg-white">
        <div className={'flex items-center space-y-2 '}>
          <div className="space-y-5">
            <p className="text-3xl font-semibold">Settings</p>
            <div className="flex space-x-5 items-center">
              <Image src={settings} alt="settings"></Image>
              <p className="text-[#71717A] text-sm">
                Manage all your settings here
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-gray-100 px-8 py-6 pb-0 tv:px-36 h-full">
        <div className="py-1">
          <NavigationMenu bordered>
            {links.map((link) => (
              <NavigationItem
                className={'flex-1 lg:flex-none'}
                link={link}
                key={link.path}
              />
            ))}
          </NavigationMenu>
        </div>

        <div
          className={`bg-white flex h-auto flex-col space-y-4 lg:flex-row ${
            title === 'Integration' && 'h-full'
          }`}
        >
          {children}
        </div>
      </div>
    </RouteShell>
  );
};

export default SettingsPageContainer;
