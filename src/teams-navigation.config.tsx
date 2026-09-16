import configuration from '~/configuration';

const TEAMS_NAVIGATION_CONFIG = {
  items: [
    {
      label: 'common:profileSettingsTabLabel',
      path: configuration.paths.appHome,
    },
    {
      label: 'common:accountSettingsTabLabel',
      path: configuration.paths.retrospectives,
    },
    {
      label: 'common:teamsTabLabel',
      path: configuration.paths.teams,
    },
    {
      label: 'common:organizationSettingsTabLabel',
      path: '/analytics',
    },
  ],
};

export default TEAMS_NAVIGATION_CONFIG;
