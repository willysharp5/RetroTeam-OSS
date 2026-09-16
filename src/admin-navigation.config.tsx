import configuration from '~/configuration';

const ADMIN_NAVIGATION_CONFIG = {
  items: [
    {
      label: 'Admin',
      path: configuration.paths.admin.admin,
    },
    {
      label: 'Users',
      path: configuration.paths.admin.users,
    },
    {
      label: 'Organizations',
      path: configuration.paths.admin.organizations,
    },
  ],
};

export default ADMIN_NAVIGATION_CONFIG;
