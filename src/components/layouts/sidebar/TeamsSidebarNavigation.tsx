import { Trans } from 'next-i18next';
import TEAMS_NAVIGATION_CONFIG from 'src/teams-navigation.config';
import { TeamsSidebarItem } from '~/core/ui/Sidebar';

function TeamsSidebarNavigation() {
  return (
    <div className="space-y-20">
      <div className={'flex flex-col space-y-1.5'}>
        {TEAMS_NAVIGATION_CONFIG.items.map((item, index) => {
          return (
            <TeamsSidebarItem key={index} path={item.path} Icon={null}>
              <Trans i18nKey={item.label} defaults={item.label} />
            </TeamsSidebarItem>
          );
        })}
      </div>
    </div>
  );
}

export default TeamsSidebarNavigation;
