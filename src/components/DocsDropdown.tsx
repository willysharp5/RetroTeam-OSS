import Link from 'next/link';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/core/ui/Dropdown';

import questionIcon from '../../public/assets/svg/question.svg';
import Image from 'next/image';

const DocsDropdown: React.FCC<{ docs: any }> = ({ docs }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={
          'hidden md:flex cursor-pointer items-center space-x-2 focus:outline-none'
        }
      >
        <Image alt="questionIcon" src={questionIcon} width={20} height={20} />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className={'!min-w-[15rem]shadow-xl lg:rounded-md !h-auto'}
      >
        <DropdownMenuItem
          className={'rounded-none !h-auto py-0'}
          clickable={false}
        >
          <div
            className={
              '!h-auto flex flex-col justify-start truncate text-left text-xs'
            }
          >
            <div className={'!h-auto text-gray-500'}>Docs</div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {docs?.map((item: any, index: number) => (
          <DropdownMenuItem key={'doc' + index}>
            <Link
              target="blank"
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

export default DocsDropdown;
