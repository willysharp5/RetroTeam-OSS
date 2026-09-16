import Link from 'next/link';
import classNames from 'clsx';
import { cva } from 'cva';

import If from '~/core/ui/If';
import Spinner from '~/core/ui/Spinner';
import { forwardRef } from 'react';

type Color =
  | 'primary'
  | 'secondary'
  | 'transparent'
  | 'danger'
  | 'custom'
  | 'pink'
  | 'gray'
  | 'red'
  | 'orange';
type Size = 'normal' | 'small' | 'large' | 'custom';
type Variant = `normal` | `outline` | `flat`;

type Props = React.ButtonHTMLAttributes<unknown> &
  React.PropsWithChildren<{
    block?: boolean;
    round?: boolean;
    color?: Color;
    size?: Size;
    variant?: Variant;
    loading?: boolean;
    href?: Maybe<string>;
  }>;

const classNameBuilder = getClassNameBuilder();
const defaultColor: Color = `primary`;
const defaultSize: Size = `normal`;
const defaultVariant = `normal`;

const Button: React.FCC<Props> = forwardRef<React.ElementRef<'button'>, Props>(
  function ButtonComponent(
    { children, color, size, variant, block, loading, href, round, ...props },
    ref,
  ) {
    const className = classNames(
      classNameBuilder({
        variant: variant ?? defaultVariant,
        color: color ?? defaultColor,
      }),
      block ? `w-full` : ``,
      loading ? `opacity-70` : ``,
      round ? 'rounded-full' : 'rounded-md',
      props.className,
    );

    const sizesClassName = getSizesClassName()[size ?? defaultSize];

    return (
      <button
        {...props}
        tabIndex={href ? -1 : 0}
        ref={ref}
        className={className}
        disabled={loading || props.disabled}
      >
        <InnerButtonContainerElement href={href} disabled={props.disabled}>
          <span
            className={classNames(
              `flex w-full flex-1 items-center justify-center`,
              sizesClassName,
            )}
          >
            <If condition={loading}>
              <Animation />
            </If>

            {children}
          </span>
        </InnerButtonContainerElement>
      </button>
    );
  },
);

function Animation() {
  return (
    <span className={'mx-2'}>
      <Spinner className={'mx-auto !h-4 !w-4 fill-white'} />
    </span>
  );
}

function InnerButtonContainerElement({
  children,
  href,
  disabled,
}: React.PropsWithChildren<{
  href: Maybe<string>;
  disabled?: boolean;
}>) {
  const className = `flex w-full items-center transition-transform duration-500 ease-out`;

  if (href && !disabled) {
    return (
      <Link className={className} href={href}>
        {children}
      </Link>
    );
  }

  return <span className={className}>{children}</span>;
}

function getClassNameBuilder() {
  return cva(
    [
      `inline-flex items-center justify-center font-medium outline-none transition-all focus:ring-2 ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 active:[&>*]:translate-y-0.5`,
    ],
    {
      variants: {
        color: {
          primary: `bg-black ring-orange-200`,
          secondary: `ring-gray-200`,
          danger: `ring-red-200`,
          transparent: `text-gray-800 focus:ring-2 focus:ring-gray-50 ring-orange-50 hover:bg-gray-50 active:bg-gray-100`,
          pink: `w-full bg-rose-400 hover:bg-rose-300 active:bg-rose-500 focus:ring-rose-300`,
          orange: `bg-orange-500 ring-orange-200 hover:bg-orange-400 `,
          custom: ``,
          gray: `bg-[#F4F4F5] hover:bg-gray-50`,
          red: `bg-[#EF4444] text-white rounded hover:bg-red-600 focus:outline-none`,
        },
        variant: {
          normal: ``,
          outline: ``,
          flat: ``,
        },
      },
      compoundVariants: [
        {
          color: 'primary',
          variant: 'normal',
          className: `text-white bg-black hover:bg-zinc-600 active:bg-zinc-500 focus:ring-zinc-300`,
        },
        {
          color: 'danger',
          variant: 'normal',
          className: `bg-red-400 text-white hover:bg-red-500 active:bg-red-600`,
        },
        {
          color: 'secondary',
          variant: 'normal',
          className: `bg-orange-500 text-white hover:bg-orange-400 active:bg-orange-700`,
        },
        {
          color: 'primary',
          variant: 'outline',
          className: `border-2 border-orange-500 bg-transparent text-orange-700`,
        },
        {
          color: 'danger',
          variant: 'outline',
          className: `border-2 border-red-400 bg-transparent text-red-400`,
        },
        {
          color: 'primary',
          variant: 'flat',
          className: `bg-orange-500/5 text-orange-500 hover:bg-orange-500/10 
      active:bg-orange-500/20`,
        },
        {
          color: 'danger',
          variant: 'flat',
          className: `bg-red-500/5 text-red-500
    active:bg-red-500/20 hover:bg-red-500/10`,
        },
      ],
      defaultVariants: {
        color: 'primary',
        variant: 'normal',
      },
    },
  );
}

function getSizesClassName() {
  return {
    normal: `text-sm py-2 px-4 h-10`,
    small: `py-2 px-3 text-xs`,
    large: `py-2.5 px-6 h-12 text-lg h-12`,
    custom: ``,
  };
}

export default Button;
