import configuration from '~/configuration';
import Image from 'next/image';
import dashboard from '/public/assets/svg/dashboard.svg';
import retrospectives from '/public/assets/svg/circuit-board.svg';
import actions from '/public/assets/svg/clipboard-check.svg';
import analytics from '/public/assets/svg/bar-chart-big.svg';
import teams from '/public/assets/svg/users.svg';
import search from 'public/assets/svg/magnifying-glass.svg';
const NAVIGATION_CONFIG = {
  items: [
    {
      label: 'common:dashboardTabLabel',
      path: configuration.paths.appHome,
      Icon: ({ className }: { className: string }) => {
        return <Image src={dashboard} className={className} alt="dashboard" />;
      },
    },
    {
      label: 'common:retrospectivesTabLabel',
      path: configuration.paths.retrospectives,
      Icon: ({ className }: { className: string }) => {
        return (
          <Image
            src={retrospectives}
            className={className}
            alt="retrospectives"
          />
        );
      },
    },
    {
      label: 'common:actionsTabLabel',
      path: configuration.paths.actions,
      Icon: ({ className }: { className: string }) => {
        return <Image src={actions} className={className} alt="actions" />;
      },
    },
    {
      label: 'common:analyticsTabLabel',
      path: '/analytics',
      Icon: ({ className }: { className: string }) => {
        return <Image src={analytics} className={className} alt="analytics" />;
      },
    },
    {
      label: 'common:settingsTabLabel',
      path: configuration.paths.settings.teams,
      Icon: ({ className }: { className: string }) => {
        return <Image src={teams} className={className} alt="teams" />;
      },
    },
    {
      label: 'Search',
      path: configuration.paths.search.retrospectives,
      Icon: ({ className }: { className: string }) => {
        return (
          <Image src={search} className={`${className} w-7 h-7`} alt="search" />
        );
      },
    },
  ],
};

export default NAVIGATION_CONFIG;
