import Link from 'next/link';
import { Trans } from 'next-i18next';
import { Bars3Icon } from '@heroicons/react/24/outline';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '~/core/ui/Dropdown';

import NAVIGATION_CONFIG from '../navigation.config';
import { useFetchDocs } from '~/lib/server/docs/get-Docs';
const MobileNavigation: React.FC = () => {
  const { data: docs } = useFetchDocs();

  const Links = NAVIGATION_CONFIG.items.map((item) => (
    <DropdownMenuItem key={item.path}>
      <Link
        href={item.path}
        className={'flex h-full w-full items-center space-x-4'}
      >
        <item.Icon className={'h-6'} />
        <span>
          <Trans i18nKey={item.label} defaults={item.label} />
        </span>
      </Link>
    </DropdownMenuItem>
  ));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Bars3Icon className={'h-8'} />
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        {Links}
        <DropdownMenuSeparator />

        {docs?.map((item: any) => (
          <DropdownMenuItem key={item.link}>
            <Link
              target="_blank"
              href={item.link}
              className={'flex h-full w-full items-center space-x-2'}
            >
              <span>{item.title}</span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MobileNavigation;
