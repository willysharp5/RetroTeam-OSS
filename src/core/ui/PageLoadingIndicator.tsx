import { PropsWithChildren } from 'react';

import logo from 'public/assets/svg/LogoText.svg';
import If from '~/core/ui/If';
import classNames from 'clsx';
import Spinner from '~/core/ui/Spinner';
import Image from 'next/image';

export default function PageLoadingIndicator({
  children,
  fullPage,
  displayLogo,
  className,
}: PropsWithChildren<{
  fullPage?: boolean;
  displayLogo?: boolean;
  className?: string;
}>) {
  const useFullPage = fullPage ?? true;
  const shouldDisplayLogo = displayLogo ?? true;

  return (
    <div
      className={classNames(
        `flex flex-col items-center justify-center space-y-6`,
        {
          ['fixed top-0 left-0 z-[100] h-screen w-screen bg-white']:
            useFullPage,
        },
        className,
      )}
    >
      <If condition={shouldDisplayLogo}>
        <div className={'my-2'}>
          <Image width={200} src={logo} alt={'logo'}></Image>
        </div>
      </If>

      <div className={'text-primary-500'}>
        <Spinner className={'h-12 w-12'} />
      </div>

      <div className={'text-sm font-medium'}>{children}</div>
    </div>
  );
}
