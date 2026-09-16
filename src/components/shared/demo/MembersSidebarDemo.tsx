import { useEffect, useState } from 'react';
import Image from 'next/image';

import Sidebar from '~/core/ui/SideBarComponent';

import x from 'public/assets/svg/x.svg';
import minus from 'public/assets/svg/minus-circle.svg';
import trash from 'public/assets/svg/trash.svg';
import copy from 'public/assets/svg/copy.svg';
import send from 'public/assets/svg/send_gray.svg';
import plus from 'public/assets/svg/plus-circled-black.svg';

import InviteBoardForm from '~/components/board/InviteBoardMembersForm';
import {
  BoardMembershipInvite,
  RequestsBoard,
} from '~/lib/board/types/membership-role';

import { TeamMembers } from '~/lib/teams/types/teams';
import BoardMembershipRoleSelector from '~/components/board/BoardMembershipRoleSelector';
import { TooltipContent, Tooltip, TooltipTrigger } from '~/core/ui/Tooltip';

import If from '~/core/ui/If';
import DropdownOptions from '../dropdownOptions';
import { Avatar, AvatarFallback } from '~/core/ui/Avatar';

interface MembersSidebarProps {
  setShowMembersSidebar: (show: boolean) => void;
  URLink: string;
  copyToClipBoard: () => void;
  loading: boolean;
  activeMembers: TeamMembers[];
  removedMembers?: TeamMembers[];
  requests?: RequestsBoard[];
  totalFacilitators: number;
  pendingInvites: any;
  isBoard: boolean;
}

export default function MembersSidebarDemo({
  setShowMembersSidebar,
  URLink,
  copyToClipBoard,
  loading,
  activeMembers,
  removedMembers,
  totalFacilitators,
  pendingInvites,
  requests,
  isBoard,
}: MembersSidebarProps) {
  return (
    <Sidebar>
      <div className="w-full md:w-auto z-40 shadow-md border-l bg-white h-full fixed top-0 right-0 overflow-y-auto px-6">
        <div className="sticky top-0 z-50 bg-white flex justify-between py-6 px-4">
          <p className="text-sm font-black">Members</p>
          <Image
            className="h-6 w-6 cursor-pointer"
            src={x}
            alt="x"
            onClick={() => setShowMembersSidebar(false)}
          ></Image>
        </div>
        <div className="text-base shadow-sm text-black font-semibold mt-4 border border-[#E4E4E7] rounded-md p-3 mb-6">
          <div className="bg-gray-100 p-2">
            <p>
              {isBoard ? 'Share this retrospective' : 'Share this icebreaker'}
            </p>
            <p className="font-normal text-[#71717A] text-sm mt-1.5">
              Anyone with the link can join this
              <br />
              {isBoard ? 'retrospective.' : 'icebreaker.'}
            </p>
            <div className="flex space-x-2 justify-between mt-6 w-full">
              <input
                value={URLink}
                disabled
                className="bg-white font-normal text-sm shadow-sm border py-1 px-3 rounded-md w-full"
                type="text"
              ></input>
              <button
                onClick={copyToClipBoard}
                className="shadow-sm bg-gray-200 py-2 w-full rounded-md text-sm font-medium"
              >
                Copy Link
              </button>
            </div>
          </div>

          <div className="bg-[#E4E4E7] my-4 h-px w-full"></div>
          <div className="space-y-6">
            <div className="bg-gray-100 p-2">
              <p className="font-medium text-sm">
                Active ({activeMembers?.length})
              </p>
              <div className="max-h-[250px] overflow-auto space-y-6 p-1">
                {activeMembers?.map((member: TeamMembers, index: number) => (
                  <MemberList
                    key={'active' + index}
                    member={member}
                    index={index}
                    totalMembers={activeMembers.length}
                    totalFacilitators={totalFacilitators}
                    isBoard={isBoard}
                  />
                ))}
              </div>
            </div>

            <If condition={isBoard}>
              <div className="bg-[#E4E4E7] my-4 h-px w-full"></div>
              <div className="bg-gray-100 p-2">
                <p className="font-medium text-sm">
                  Removed ({removedMembers?.length})
                </p>
                <div className="max-h-[250px] overflow-auto space-y-6 p-1">
                  {removedMembers?.map((member: TeamMembers, index: number) => (
                    <MemberList
                      key={'removed' + index}
                      member={member}
                      index={index}
                      totalMembers={removedMembers.length}
                      totalFacilitators={totalFacilitators}
                      isBoard={isBoard}
                    />
                  ))}
                </div>
              </div>

              <div className="bg-[#E4E4E7] my-4 h-px w-full"></div>
              <div className="bg-gray-100 p-2">
                <InviteBoardForm
                  isDemo={true}
                  trigger={() => {}}
                  submitAction={() => {}}
                  body={{}}
                />
              </div>

              <div className="bg-[#E4E4E7] my-4 h-px w-full"></div>
              <div className="space-y-6">
                <div className="bg-gray-100 p-2">
                  <p className="font-medium text-sm">
                    Pending ({pendingInvites?.length})
                  </p>
                  <div className="max-h-[250px] overflow-auto w-full space-y-6 p-1">
                    {requests?.map((request: RequestsBoard, index: number) => {
                      return (
                        <div
                          className="flex justify-between"
                          key={'pending' + index}
                        >
                          <div className="w-full flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Tooltip className="w-max" title="Remove Member">
                                <TooltipTrigger asChild>
                                  <button disabled>
                                    <Image alt="plus" src={plus} />
                                  </button>
                                </TooltipTrigger>

                                <TooltipContent>Accept to Board</TooltipContent>
                              </Tooltip>
                              <div className="w-auto">
                                {/*   <Avatar
                                  selectedMember={request.userId}
                                />*/}
                              </div>
                              <div>
                                <p className="font-medium text-sm">
                                  {' '}
                                  {request.userName}
                                </p>
                                <p className="font-normal text-sm text-[#71717A]">
                                  {request.email}
                                </p>
                              </div>
                            </div>
                            <div className="">
                              {request.status === 'denied' && (
                                <p className="font-normal text-sm text-red-500">
                                  {request.status}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {pendingInvites?.map(
                      (invite: BoardMembershipInvite, index: number) => {
                        const menuOptions = [
                          {
                            name: 'Resend',
                            action: () => () => {},
                            icon: send,
                          },
                          {
                            name: 'Delete',
                            action: () => () => {},
                            icon: trash,
                          },
                          {
                            name: 'Copy Invite URL',
                            action: () => () => {},
                            icon: copy,
                          },
                        ];

                        return (
                          <div
                            className="flex justify-between"
                            key={'invite' + index}
                          >
                            <>
                              <div className="flex items-center space-x-3">
                                <div className="w-auto">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 font-semibold uppercase text-white"></div>
                                </div>
                                <div>
                                  <p className="font-normal text-sm text-[#71717A]">
                                    {invite.email}
                                  </p>
                                </div>
                              </div>
                              <div className="relative">
                                <DropdownOptions options={menuOptions} />
                              </div>
                            </>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              </div>
            </If>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}

function MemberList({
  member,
  index,
  totalMembers,
  totalFacilitators,
  isBoard,
}: any) {
  const ProfileAvatar: React.FC<{ selectedMember: string }> = ({
    selectedMember,
  }) => {
    return selectedMember !== '' ? (
      <Avatar>
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
    ) : (
      <div>
        <span className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full">
          <span className="flex h-full w-full items-center justify-center rounded-full bg-gray-300 font-semibold uppercase text-white"></span>
        </span>
      </div>
    );
  };

  const [memberRole, setMemberRole] = useState(member.role);

  useEffect(() => {
    if (member) setMemberRole(member.role);
  }, [member]);

  return (
    <div className="flex justify-between" key={'member' + index}>
      <div className="flex space-x-3 items-center">
        <If condition={isBoard}>
          <Tooltip className="w-max" title="Remove Member">
            <TooltipTrigger asChild>
              {member.role > 0 && member.active && totalFacilitators > 1 ? (
                <button disabled>
                  <Image alt="minus" src={minus} />
                </button>
              ) : member.active && member.role === 0 && totalMembers > 1 ? (
                <button disabled>
                  <Image alt="minus" src={minus} />
                </button>
              ) : (
                !member.active && (
                  <button disabled>
                    <Image alt="plus" src={plus} />
                  </button>
                )
              )}
            </TooltipTrigger>

            {member.active ? (
              <TooltipContent>Remove user from board</TooltipContent>
            ) : (
              <TooltipContent>Add user to board</TooltipContent>
            )}
          </Tooltip>
        </If>
        <div className="w-auto">
          <ProfileAvatar selectedMember={member.userId} />
        </div>
        <div>
          <p className="font-medium text-sm">{member.fullName}</p>
          {member.email !== '' && (
            <p className="font-normal text-sm text-[#71717A]">{member.email}</p>
          )}
        </div>
      </div>

      <div className="">
        <Tooltip className="w-max" title="Board MembershipRole Selector">
          <TooltipTrigger asChild>
            <div>
              <BoardMembershipRoleSelector disabled={true} value={memberRole} />
            </div>
          </TooltipTrigger>

          {member.email === '' && (
            <TooltipContent>
              Only signed up members can be a facilitator
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    </div>
  );
}
