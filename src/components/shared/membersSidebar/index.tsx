import { useEffect, useState } from 'react';
import Image from 'next/image';

import Sidebar from '~/core/ui/SideBarComponent';

import x from 'public/assets/svg/x.svg';
import minus from 'public/assets/svg/minus-circle.svg';
import trash from 'public/assets/svg/trash.svg';
import copy from 'public/assets/svg/copy.svg';
import send from 'public/assets/svg/send_gray.svg';
import plus from 'public/assets/svg/plus-circled-black.svg';

import UserImage from '~/components/dashboard/UserImage';
import InviteBoardForm from '~/components/board/InviteBoardMembersForm';
import {
  BoardMembershipInvite,
  RequestsBoard,
} from '~/lib/board/types/membership-role';
import ContextMenu from '../contextMenu';
import { TeamMembers } from '~/lib/teams/types/teams';
import BoardMembershipRoleSelector from '~/components/board/BoardMembershipRoleSelector';
import { TooltipContent, Tooltip, TooltipTrigger } from '~/core/ui/Tooltip';
import { useAuth } from 'reactfire';
import { MembershipRole } from '~/lib/organizations/types/membership-role';
import If from '~/core/ui/If';
import DropdownOptions from '../dropdownOptions';

interface MembersSidebarProps {
  setShowMembersSidebar: (show: boolean) => void;
  organizationId: string;
  onInvite: Function;
  URLink: string;
  copyToClipBoard: () => void;
  updateMemberRole: (userId: string, role: number) => void;
  removeMember: (userId: string, activate: boolean) => void;
  loading: boolean;
  activeMembers?: TeamMembers[];
  removedMembers?: TeamMembers[];
  requests?: RequestsBoard[];
  totalFacilitators: number;
  submitAction: Function;
  body: any;
  pendingInvites: BoardMembershipInvite[];
  resend: Function;
  deleteInvite: Function;
  copyInviteToClipBoard: Function;
  acceptMemberToBoard: (userId: string, accept: boolean, toastId: any) => void;
  currentUserRole: number;
  isBoard: boolean;
}

export default function MembersSidebar({
  setShowMembersSidebar,
  organizationId,
  onInvite,
  URLink,
  copyToClipBoard,
  updateMemberRole,
  removeMember,
  loading,
  activeMembers,
  removedMembers,
  totalFacilitators,
  submitAction,
  body,
  pendingInvites,
  resend,
  deleteInvite,
  copyInviteToClipBoard,
  requests,
  currentUserRole,
  acceptMemberToBoard,
  isBoard = false,
}: MembersSidebarProps) {
  const [totalRequests, setTotalRequests] = useState(0);

  useEffect(() => {
    if (requests) setTotalRequests(requests.length);
  }, [requests]);

  const auth = useAuth();
  const userId = auth?.currentUser?.uid as string;

  if (currentUserRole === MembershipRole.Member) {
    const sortedMembers = activeMembers?.sort((a, b) => {
      if (a.userId === userId) return -1;
      if (b.userId === userId) return 1;
      return 0;
    });

    return (
      <Sidebar>
        <div className="w-full md:w-auto md:min-w-[350px] z-40 shadow-md border-l bg-white h-full fixed top-0  right-0 overflow-y-auto px-6">
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
            <div className="space-y-6 bg-gray-100 p-2">
              <p className="font-medium text-sm">
                Active ({activeMembers?.length})
              </p>
              <div className="space-y-6 p-1 overflow-x-auto">
                {sortedMembers?.map((member: TeamMembers, index: number) => (
                  <MemberList
                    key={'active' + index}
                    member={member}
                    index={index}
                    organizationId={organizationId}
                    updateMemberRole={updateMemberRole}
                    removeMember={removeMember}
                    totalMembers={sortedMembers.length}
                    totalFacilitators={totalFacilitators}
                    currentUserRole={currentUserRole}
                    userId={userId}
                    isBoard={isBoard}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </Sidebar>
    );
  }

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
                    organizationId={organizationId}
                    updateMemberRole={updateMemberRole}
                    removeMember={removeMember}
                    totalMembers={activeMembers.length}
                    totalFacilitators={totalFacilitators}
                    currentUserRole={currentUserRole}
                    userId={userId}
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
                      organizationId={organizationId}
                      updateMemberRole={updateMemberRole}
                      removeMember={removeMember}
                      totalMembers={removedMembers.length}
                      totalFacilitators={totalFacilitators}
                      currentUserRole={currentUserRole}
                      userId={userId}
                      isBoard={isBoard}
                    />
                  ))}
                </div>
              </div>

              <div className="bg-[#E4E4E7] my-4 h-px w-full"></div>
              <div className="bg-gray-100 p-2">
                <InviteBoardForm
                  trigger={onInvite}
                  submitAction={submitAction}
                  body={body}
                />
              </div>

              <div className="bg-[#E4E4E7] my-4 h-px w-full"></div>
              <div className="space-y-6">
                <div className="bg-gray-100 p-2">
                  <p className="font-medium text-sm">
                    Pending ({pendingInvites?.length + totalRequests})
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
                                  <button
                                    onClick={() => {
                                      if (acceptMemberToBoard) {
                                        acceptMemberToBoard(
                                          request.userId,
                                          true,
                                          '',
                                        );
                                      }
                                    }}
                                  >
                                    <Image alt="plus" src={plus} />
                                  </button>
                                </TooltipTrigger>

                                <TooltipContent>Accept to Board</TooltipContent>
                              </Tooltip>
                              <div className="w-auto">
                                <UserImage
                                  organizationId={organizationId}
                                  selectedMember={request.userId}
                                />
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
                            action: () => resend(invite),
                            icon: send,
                          },
                          {
                            name: 'Delete',
                            action: () => deleteInvite(invite.code),
                            icon: trash,
                          },
                          {
                            name: 'Copy Invite URL',
                            action: () => copyInviteToClipBoard(invite.code),
                            icon: copy,
                          },
                        ];

                        const isLastItem = index >= pendingInvites.length - 2;

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
  organizationId,
  updateMemberRole,
  removeMember,
  totalMembers,
  totalFacilitators,
  currentUserRole,
  userId,
  isBoard,
}: any) {
  const [memberRole, setMemberRole] = useState(member.role);

  useEffect(() => {
    if (member) setMemberRole(member.role);
  }, [member]);

  if (currentUserRole === MembershipRole.Member) {
    const currentUser = userId === member.userId;

    return (
      <div className="flex justify-between" key={'member' + index}>
        <div className="flex space-x-3 items-center">
          <If condition={currentUser}>
            <div>
              <Tooltip className="w-max" title="Remove Member">
                <TooltipTrigger asChild>
                  <button onClick={() => removeMember(member.userId, false)}>
                    <Image alt="minus" src={minus} />
                  </button>
                </TooltipTrigger>

                <TooltipContent>Remove yourself from board</TooltipContent>
              </Tooltip>
            </div>
          </If>

          <div className="w-auto">
            <UserImage
              organizationId={organizationId}
              selectedMember={member.userId}
            />
          </div>
          <div className="w-full">
            <p className="font-medium text-sm">{member.fullName}</p>
            {member.email !== '' && (
              <p className="font-normal text-sm text-[#71717A]">
                {member.email}
              </p>
            )}
          </div>
        </div>

        <div className="">
          <Tooltip className="w-max" title="Board MembershipRole Selector">
            <TooltipTrigger asChild>
              <div>
                <BoardMembershipRoleSelector
                  disabled={true}
                  value={memberRole}
                  onChange={(role) => {
                    setMemberRole(role);
                    updateMemberRole(member.userId, role);
                  }}
                />
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

  return (
    <div className="flex justify-between" key={'member' + index}>
      <div className="flex space-x-3 items-center">
        <If condition={isBoard}>
          <Tooltip className="w-max" title="Remove Member">
            <TooltipTrigger asChild>
              {member.role > 0 && member.active && totalFacilitators > 1 ? (
                <button onClick={() => removeMember(member.userId, false)}>
                  <Image alt="minus" src={minus} />
                </button>
              ) : member.active && member.role === 0 && totalMembers > 1 ? (
                <button onClick={() => removeMember(member.userId, false)}>
                  <Image alt="minus" src={minus} />
                </button>
              ) : (
                !member.active && (
                  <button onClick={() => removeMember(member.userId, true)}>
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
          <UserImage
            organizationId={organizationId}
            selectedMember={member.userId}
          />
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
              <BoardMembershipRoleSelector
                disabled={
                  !isBoard
                    ? true
                    : member.email === '' ||
                      (member.role > 0 &&
                        member.active &&
                        totalFacilitators === 1)
                }
                value={memberRole}
                onChange={(role) => {
                  setMemberRole(role);
                  updateMemberRole(member.userId, role);
                }}
              />
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
