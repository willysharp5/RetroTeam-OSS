import React, { useContext } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

import classNames from 'clsx';
import { cva } from 'cva';

import If from '~/core/ui/If';
import { TooltipContent, Tooltip, TooltipTrigger } from '~/core/ui/Tooltip';

import { SidebarContext } from '~/core/contexts/sidebar';
import { isRouteActive } from '~/core/is-route-active';

export function Sidebar({ children }: React.PropsWithChildren) {
  const { collapsed, setCollapsed } = useContext(SidebarContext);

  const className = getClassNameBuilder()({
    collapsed,
  });

  return (
    <div className={className}>
      <div className={'flex w-full flex-col space-y-7 px-4'}>
        <div className={'flex flex-col space-y-1'}>{children}</div>
      </div>

      <AppSidebarFooterMenu collapsed={collapsed} setCollapsed={setCollapsed} />
    </div>
  );
}

export function SidebarItem({
  end,
  path,
  children,
  Icon,
}: React.PropsWithChildren<{
  path: string;
  Icon: React.ElementType;
  end?: boolean;
}>) {
  const { collapsed } = useContext(SidebarContext);

  const iconClassName = getSidebarIconClassBuilder()({
    collapsed,
  });

  const currentPath = usePathname() ?? '';
  const active = isRouteActive(path, currentPath, end ? 0 : 3);

  const className = getSidebarItemClassBuilder()({
    collapsed,
    active,
  });

  return (
    <Link key={path} href={path} className={className}>
      <If condition={collapsed}>
        <Tooltip>
          <TooltipTrigger>
            <Icon className={iconClassName} />
          </TooltipTrigger>

          <TooltipContent side={'right'} sideOffset={20}>
            {children}
          </TooltipContent>
        </Tooltip>
      </If>

      <span>{children}</span>
    </Link>
  );
}

function AppSidebarFooterMenu(
  props: React.PropsWithChildren<{
    collapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
  }>,
) {
  return (
    <div
      className={classNames(`absolute bottom-10 w-full`, {
        'px-6': !props.collapsed,
        'flex justify-center px-2': props.collapsed,
      })}
    >
      <div
        className={
          'flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-800'
        }
      ></div>
    </div>
  );
}

export default Sidebar;

function getClassNameBuilder() {
  return cva(
    [
      'relative flex h-full flex-row justify-center border-r border-gray-100 py-4 lg:flex',
    ],
    {
      variants: {
        collapsed: {
          true: `w-[5rem]`,
          false: `w-2/12 max-w-xs sm:min-w-[12rem] lg:min-w-[17rem]`,
        },
      },
    },
  );
}

function getSidebarItemClassBuilder() {
  return cva(
    [
      `flex w-full items-center rounded-md border-transparent text-sm font-medium text-gray-600 transition-colors duration-300`,
    ],
    {
      variants: {
        collapsed: {
          true: `justify-center space-x-0 px-0.5 py-2`,
          false: `py-2 px-3 pr-12 space-x-2.5`,
        },
        active: {
          true: `text-lg font-semibold text-orange-500 underline`,
          false: `text-lg font-semibold text-black hover:text-slate-800`,
        },
      },
      compoundVariants: [
        {
          collapsed: true,
          active: true,
          className: `bg-primary-500/5 !text-primary-500`,
        },
        {
          collapsed: false,
          active: true,
          className: `font-medium text-current [&>svg]:text-primary-500`,
        },
        {
          collapsed: true,
          active: false,
          className: `text-gray-600`,
        },
      ],
    },
  );
}

function getSidebarIconClassBuilder() {
  return cva([''], {
    variants: {
      collapsed: {
        true: `h-7`,
        false: `h-6`,
      },
    },
  });
}
