import { Trans } from 'next-i18next';
import { useContext } from 'react';
import { SidebarContext } from '~/core/contexts/sidebar';
import NAVIGATION_CONFIG from '../../../navigation.config';
import { SidebarItem } from '~/core/ui/Sidebar';

function AppSidebarNavigation() {
  const { collapsed, setCollapsed } = useContext(SidebarContext);

  return (
    <div className="space-y-[30px]">
      <div className={'flex flex-col space-y-1.5'}>
        {NAVIGATION_CONFIG.items.map((item, index) => {
          return (
            <SidebarItem key={index} path={item.path} Icon={item.Icon}>
              <Trans i18nKey={item.label} defaults={item.label} />
            </SidebarItem>
          );
        })}
      </div>
    </div>
  );
}

export default AppSidebarNavigation;
