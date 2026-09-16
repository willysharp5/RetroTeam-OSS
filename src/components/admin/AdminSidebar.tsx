import {
  CpuChipIcon,
  HomeIcon,
  UserGroupIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { AdminSidebarItem, SidebarAdmin } from '~/core/ui/Sidebar';

function AdminSidebar() {
  return (
    <SidebarAdmin>
      <AdminSidebarItem
        end
        path={'/admin'}
        Icon={() => <HomeIcon className={'h-6'} />}
      >
        Admin
      </AdminSidebarItem>

      <AdminSidebarItem
        path={'/admin/users'}
        Icon={() => <UserIcon className={'h-6'} />}
      >
        Users
      </AdminSidebarItem>

      <AdminSidebarItem
        path={'/admin/organizations'}
        Icon={() => <UserGroupIcon className={'h-6'} />}
      >
        Organizations
      </AdminSidebarItem>

      <AdminSidebarItem
        path={'/admin/ai'}
        Icon={() => <CpuChipIcon className={'h-6'} />}
      >
        AI Settings
      </AdminSidebarItem>
    </SidebarAdmin>
  );
}

export default AdminSidebar;
