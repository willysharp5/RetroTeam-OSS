import Image from 'next/image';

import plus from 'public/assets/svg/plus.svg';

import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '~/core/ui/SelectAsignees';

import { SelectIcon } from '@radix-ui/react-select';

import UserImage from '../dashboard/UserImage';
import { TeamMembers } from '~/lib/teams/types/teams';

const TeamAsigneeSelector: React.FCC<{
  organizationId: string;
  setSelectedMember: (asignee: string) => void;
  selectedMember: string;
  membersData: TeamMembers[] | any[] | null;
  className?: any;
}> = ({
  organizationId,
  selectedMember,
  setSelectedMember,
  membersData,
  className,
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
                <p className="ml-4 text-[#71717A] text-xs">Assignee</p>
              </div>
            </SelectIcon>
          )}
        </SelectTrigger>

        <SelectContent>
          {membersData?.map((members: any, index: number) => {
            return (
              <SelectItem
                key={index}
                data-cy={'organization-member'}
                value={members.userId}
              >
                <div className="flex flex-auto items-center space-x-4">
                  <UserImage
                    organizationId={organizationId}
                    selectedMember={members.userId}
                  />
                  <div className="flex-1 min-w-0 text-xs">
                    {members.data ? (
                      <p className="truncate">{members.data.fullName}</p>
                    ) : (
                      <p className="truncate">{members.fullName}</p>
                    )}
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </>
  );
};

export default TeamAsigneeSelector;
