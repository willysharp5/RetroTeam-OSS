import Link from 'next/link';
import { useRouter } from 'next/router';
import { useContext } from 'react';

import { Trans } from 'next-i18next';
import classNames from 'clsx';
import { cva } from 'cva';

import { isRouteActive, isRouteTabActive } from '~/core/is-route-active';
import { NavigationMenuContext } from './NavigationMenuContext';

interface Link {
  path: string;
  label?: string;

  /**
   * @deprecated - Simply use {@link label}
   */
  i18n?: string;
}

const NavigationMenuItem: React.FCC<{
  link: Link;
  depth?: number;
  disabled?: boolean;
  shallow?: boolean;
  className?: string;
}> = ({ link, disabled, shallow, depth, ...props }) => {
  const router = useRouter();
  const active = isRouteTabActive(link.path, router.asPath, depth ?? 1);
  const menuProps = useContext(NavigationMenuContext);
  const label = link.label ?? link.i18n;

  const className = getNavigationMenuItemClassBuilder()({
    active,
    ...menuProps,
  });

  return (
    <Link
      className={classNames(className, props.className ?? ``)}
      aria-disabled={disabled}
      href={disabled ? '' : link.path}
      shallow={shallow ?? active}
    >
      <span className={'transition-transform duration-500'}>
        <Trans i18nKey={label} defaults={label} />
      </span>
    </Link>
  );
};

export default NavigationMenuItem;

function getNavigationMenuItemClassBuilder() {
  return cva(
    [
      `p-1 lg:px-2.5 flex items-center justify-center font-semibold lg:justify-start rounded-md text-sm transition-colors active:[&>*]:translate-y-[2px]`,
    ],
    {
      compoundVariants: [
        // not active - shared
        {
          active: false,
          className: `active:text-current text-gray-600 dark:text-gray-300
        hover:text-current dark:hover:text-white`,
        },
        // active - shared
        {
          active: true,
          className: `text-gray-800 dark:text-white`,
        },
        // active - pill
        {
          active: true,
          pill: true,
          className: `bg-white text-gray-600 text-current`,
        },
        // not active - pill
        {
          active: false,
          pill: true,
          className: `hover:bg-gray-50 active:bg-gray-100 text-gray-500 dark:text-gray-300 dark:hover:bg-dark-800 dark:active:bg-dark-700`,
        },
        // not active - bordered
        {
          active: false,
          bordered: true,
          className: `hover:bg-gray-50 active:bg-gray-100 transition-colors rounded-lg border-transparent`,
        },
        // active - bordered
        {
          active: true,
          bordered: true,
          className: `top-[0.4rem] border-b-[0.25rem] rounded-none border-orange-500 bg-transparent pb-[0.8rem] text-current`,
        },
        // active - secondary
        {
          active: true,
          secondary: true,
          className: `bg-transparent font-semibold`,
        },
      ],
      variants: {
        active: {
          true: ``,
        },
        pill: {
          true: `py-2`,
        },
        bordered: {
          true: `relative h-10`,
        },
        secondary: {
          true: ``,
        },
      },
    },
  );
}
