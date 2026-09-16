import Logo from 'public/assets/svg/LogoText.svg';
import Bars3Icon from '@heroicons/react/24/outline/Bars3Icon';
import eye from '/public/assets/svg/eye-closed.svg';
import eyeOn from '/public/assets/svg/eye-open.svg';
import lock from '/public/assets/svg/lock-closed.svg';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/core/ui/Dropdown';
import Image from 'next/image';
import If from '~/core/ui/If';

interface NavigationItem {
  action: () => void;
  name: string;
}

interface Props {
  navigation: NavigationItem[];
  accessType: string;
  role: number;
  isLocked: boolean;
}

const BoardDemoMobileNavigation: React.FC<Props> = ({
  navigation,
  accessType,
  isLocked,
  role,
}: Props) => {
  const Links = navigation.map((item: any, index) => {
    return (
      <DropdownMenuItem key={'board mobile navigation' + index}>
        <button
          onClick={item.action}
          className={'flex h-full w-full items-center space-x-4'}
        >
          <span>{item.name}</span>
        </button>
      </DropdownMenuItem>
    );
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Bars3Icon className={'h-8'} />
      </DropdownMenuTrigger>
      <div className="h-full">
        <DropdownMenuContent>
          <div className="py-3">
            <div className="border-b p-3">
              <Image alt="logo" width={107} src={Logo}></Image>
            </div>

            <div className="flex justify-between space-x-2 border-b p-3">
              <If condition={isLocked}>
                <div className="flex items-center bg-red-100 px-3.5 py-2 rounded-lg space-x-2">
                  <Image alt="lock" src={lock} />
                  <p className="text-sm">Board is locked</p>
                </div>
              </If>
              {accessType === 'private' || accessType === 'team' ? (
                <div className="flex items-center w-fit bg-blue-100 px-3.5 py-2 rounded-lg space-x-2">
                  <Image alt="eye" src={eye} />
                  <p className="text-sm">Private</p>
                </div>
              ) : (
                <div className="flex items-center w-fit bg-blue-100 px-3.5 py-2 rounded-lg space-x-2">
                  <Image alt="eye" src={eyeOn} />
                  <p className="text-sm">Public</p>
                </div>
              )}
            </div>
          </div>

          <button className="bg-[#F4F4F5] w-[250px] p-2 text-left text-sm rounded-md">
            <p>{role > 0 ? 'Facilitator' : 'Member'} (You)</p>
          </button>
          {Links}
        </DropdownMenuContent>
      </div>
    </DropdownMenu>
  );
};

export default BoardDemoMobileNavigation;
