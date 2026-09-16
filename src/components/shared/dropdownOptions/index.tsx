import { Trans } from 'next-i18next';
import Image from 'next/image';
import React from 'react';

import {
  EllipsisHorizontalIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/core/ui/Dropdown';

import IconButton from '~/core/ui/IconButton';

interface Option {
  name: string;
  action: () => void | any;
  icon?: string;
}

interface DropdownOptionsProps {
  options: Option[];
  disabled?: boolean;
  type?: string;
}

const DropdownOptions: React.FC<DropdownOptionsProps> = ({
  options,
  disabled = false,
  type = 'horizontal',
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <IconButton
          data-cy={'member-actions-dropdown'}
          disabled={disabled}
          label={'Open members actions menu'}
        >
          {type === 'horizontal' ? (
            <EllipsisHorizontalIcon className={'h-5'} />
          ) : (
            <EllipsisVerticalIcon className={'h-5'} />
          )}
        </IconButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        style={{ width: 'auto' }}
        collisionPadding={{ right: 50 }}
      >
        <div className="space-y-2 py-1.5 px-2">
          {options.map((option: Option, index: number) => (
            <DropdownMenuItem
              key={index}
              data-cy={'remove-member-action'}
              className={'cursor-pointer hover:!bg-transparent h-auto'}
              onClick={option.action}
            >
              <span
                className={'flex items-center space-x-2 text-sm font-normal'}
              >
                {option.icon && (
                  <Image
                    width={16}
                    height={16}
                    src={option.icon}
                    alt={option.name.toLowerCase()}
                  />
                )}
                <p className="text-sm font-normal">{option.name}</p>
              </span>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DropdownOptions;
