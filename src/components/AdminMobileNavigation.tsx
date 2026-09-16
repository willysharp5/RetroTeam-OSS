import Link from 'next/link';
import { Trans } from 'next-i18next';
import Bars3Icon from '@heroicons/react/24/outline/Bars3Icon';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/core/ui/Dropdown';

import ADMIN_NAVIGATION_CONFIG from 'src/admin-navigation.config';

const AdminMobileNavigation: React.FC = () => {
  const Links = ADMIN_NAVIGATION_CONFIG.items.map((item) => {
    return (
      <DropdownMenuItem key={item.path}>
        <Link
          href={item.path}
          className={'flex h-full w-full items-center space-x-4'}
        >
          <span>
            <Trans i18nKey={item.label} defaults={item.label} />
          </span>
        </Link>
      </DropdownMenuItem>
    );
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Bars3Icon className={'h-8'} />
      </DropdownMenuTrigger>

      <DropdownMenuContent>{Links}</DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AdminMobileNavigation;
