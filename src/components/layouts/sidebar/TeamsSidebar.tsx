import React from 'react';

import TeamsSidebarNavigation from './TeamsSidebarNavigation';
import Sidebar from '~/core/ui/Sidebar';

const TeamsSidebar = () => {
  return (
    <Sidebar>
      <TeamsSidebarNavigation />
    </Sidebar>
  );
};

export default TeamsSidebar;
