import { useEffect, useState } from 'react';

import Image from 'next/image';

import plus from '../../../public/assets/svg/plus.svg';

import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '~/core/ui/SelectAsignees';
import { Avatar, AvatarFallback } from '~/core/ui/Avatar';

import { SelectIcon } from '@radix-ui/react-select';

import { TeamMembers } from '~/lib/teams/types/teams';

const BoardAsigneeSelector: React.FCC<{
  setSelectedMember: (asignee: string) => void;
  selectedMember: string;
  className?: any;
  members: any;
}> = ({ selectedMember, setSelectedMember, className, members }) => {
  const ProfileAvatar: React.FC<{ selectedMember: string }> = ({
    selectedMember,
  }) => {
    return selectedMember !== '' && selectedMember !== 'anonymous' ? (
      <Avatar>
        <AvatarFallback>
          {selectedMember.trim().charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
    ) : (
      <div>
        <span className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full">
          <span className="flex h-full w-full items-center justify-center rounded-full bg-gray-300 font-semibold uppercase text-white"></span>
        </span>
      </div>
    );
  };
  const [boardMembers, setBoardMembers] = useState([]);
  useEffect(() => {
    if (members) {
      const _members = Object.values(members) as any;

      const activeMembers = _members.filter(
        (member: TeamMembers) => member.active === true,
      );
      setBoardMembers(activeMembers);
    }
  }, [members]);

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
            <SelectValue>
              {selectedMember !== '' && (
                <div className="flex gap-3 items-center">
                  <ProfileAvatar selectedMember={selectedMember} />
                  <p className="text-xs"> {selectedMember}</p>
                </div>
              )}
            </SelectValue>
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
          {boardMembers.map((member: any) => (
            <SelectItem
              key={member.email}
              data-cy={'organization-member'}
              value={member.fullName}
            >
              <div className="flex flex-auto items-center space-x-4">
                <ProfileAvatar selectedMember={member.fullName} />
                <div className="flex-1 min-w-0 text-xs">
                  <p className="truncate">{member.fullName}</p>
                </div>
              </div>
            </SelectItem>
          ))}
          <SelectItem
            key={'anonymous'}
            data-cy={'organization-member'}
            value={'anonymous'}
          >
            <div className="flex flex-auto items-center space-x-4">
              <ProfileAvatar selectedMember="" />
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
