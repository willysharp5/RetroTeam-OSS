import Image from 'next/image';

import plus from '../../../public/assets/svg/plus.svg';

import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '~/core/ui/SelectAsignees';

import { SelectIcon } from '@radix-ui/react-select';

import UserImage from '../dashboard/UserImage';

const BoardAsigneeSelector: React.FCC<{
  organizationId: string;
  setSelectedMember: (asignee: string) => void;
  selectedMember: string;
  name: string;
  className?: any;
  userId: string;
}> = ({
  organizationId,
  selectedMember,
  setSelectedMember,
  className,
  name,
  userId
}) => {

  return (
    <>
      <Select
        value={selectedMember}
        onValueChange={(value) => {
          setSelectedMember(value);
        }}
      >
        <SelectTrigger data-cy={'role-selector-trigger'}>
          <div className={className ? className : 'w-[111px] overflow-hidden'}>
            <SelectValue />
          </div>
          {selectedMember === '' && (
            <SelectIcon>
              <div className="flex items-center">
                <div className="bg-black rounded-full p-1 h-6 w-6">
                  <Image src={plus} alt="plus" />
                </div>
                <p className="ml-4 text-[#71717A] text-xs">Author</p>
              </div>
            </SelectIcon>
          )}
        </SelectTrigger>

        <SelectContent>
          <SelectItem
            key={userId}
            data-cy={'organization-member'}
            value={userId}
          >
            <div className="flex flex-auto items-center space-x-4">
              <UserImage
                organizationId={organizationId}
                selectedMember={userId}
              />
              <div className="flex-1 min-w-0 text-xs">
                <p className="truncate">{name}</p>
              </div>
            </div>
          </SelectItem>
          <SelectItem
            key={'anonymous'}
            data-cy={'organization-member'}
            value={'anonymous'}
          >
            <div className="flex flex-auto items-center space-x-4">
              <UserImage organizationId={organizationId} selectedMember={''} />
              <div className="flex-1 min-w-0 text-xs">
                <p className="truncate">Anonymous</p>
              </div>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </>
  );
};

export default BoardAsigneeSelector;
