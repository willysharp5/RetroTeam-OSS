import { useState, useEffect } from 'react';
import Image from 'next/image';

import { InfoContainer, Participant } from '../Results';
import { useGetBoardByRetrospectiveId } from '~/lib/board/hooks/use-get-board-by-retrospective';
import { useCurrentOrganization } from '~/lib/organizations/hooks/use-current-organization';

import { TeamMembers } from '~/lib/teams/types/teams';

import close from 'public/assets/svg/close.svg';

interface MembersCardProps {
  closeModal: () => void;
  activeMembers: TeamMembers[] | undefined
}

const MembersCard = ({
  closeModal,
  activeMembers,
}: MembersCardProps) => {
  const organization = useCurrentOrganization();
  const organizationId = organization?.id as string;

  const [showAllMembers, setShowAllMembers] = useState(false);

  const handleShowAllMembers = () => {
    setShowAllMembers(true);
  };

  return (
    <InfoContainer hasHeader={true}>
      <Image
        className="absolute top-2 md:top-5 right-5 cursor-pointer"
        src={close}
        alt="close"
        onClick={closeModal}
      />
      <div className="mb-6">
        <span className="text-zinc-500 text-sm">
          Members in this retrospective
        </span>
      </div>
      <div
        id="participants"
        className="grid md:grid-cols-3 gap-y-4 max-h-[251px] overflow-y-auto"
      >
        {activeMembers &&
          activeMembers
            .slice(
              0,
              showAllMembers
                ? activeMembers.length
                : activeMembers.length > 6
                ? 5
                : 6,
            )
            .map((member, index) => (
              <Participant
                organizationId={organizationId}
                userId={member.userId}
                key={`${index} ${member.userId}`}
                name={member.fullName}
                role={member.role > 0 ? 'Facilitator' : 'Member'}
              />
            ))}
        {activeMembers && activeMembers.length > 6 && !showAllMembers && (
          <button
            className="flex items-center space-x-2 py-4"
            onClick={handleShowAllMembers}
          >
            <div className="bg-[#EF444480] flex justify-center rounded-full h-8 w-8  ">
              <p className="font-normal">.....</p>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-zinc-900 text-sm">
                {activeMembers.length - 5} more
              </span>
              <span className="text-zinc-500 text-sm font-normal">
                Participants
              </span>
            </div>
          </button>
        )}
      </div>
    </InfoContainer>
  );
};

export default MembersCard;
