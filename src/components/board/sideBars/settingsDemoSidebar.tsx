import { useState } from 'react';
import toast from 'react-hot-toast';
import toaster from 'react-hot-toast';
import Image from 'next/image';

import Sidebar from '~/core/ui/SideBarComponent';

import x from 'public/assets/svg/x.svg';
import { Retrospectives } from '~/lib/retrospectives/types/retrospectives';
import If from '~/core/ui/If';

interface SettingsSidebarProps {
  setShowSettingsBar: (show: boolean) => void;
  onUpdateBoardSettings: (type: string, value: any, from: string) => void;
  onUpdateRetrospectiveSettings: (
    type: string,
    value: any,
    name: string,
  ) => void;
  lockedBoard: boolean;
  setLockedBoard: (lock: boolean) => void;
  access: string;
  groupWithAI: boolean;
  actionsWithAI: boolean;
  retrospective: Retrospectives;
  voteNumber: number;
  setVoteNumber: (number: number) => void;
  totalVotes: number;
  loading: boolean;
  showMembersComments: boolean;
  isSuperAdmin: boolean;
  showAuthors: boolean;
  setShowAuthors: (show: boolean) => void;
  setAccessType: (access: string) => void;
  accessType: string;
}
export default function SettingsSidebarDemo({
  setShowSettingsBar,
  showMembersComments,
  lockedBoard,
  setLockedBoard,
  access,
  groupWithAI,
  actionsWithAI,
  onUpdateBoardSettings,
  onUpdateRetrospectiveSettings,
  retrospective,
  voteNumber,
  setVoteNumber,
  totalVotes,
  loading,
  isSuperAdmin,
  showAuthors,
  setShowAuthors,
  setAccessType,
  accessType,
}: SettingsSidebarProps) {
  const [showMembersComment, setShowMembersComment] =
    useState(showMembersComments);

  const [boardAccess, setBoardAcess] = useState(access);
  const [useGroupWithAI, setUseGroupWithAI] = useState(groupWithAI);
  const [useActionsWithAI, setUseActionsWithAI] = useState(actionsWithAI);

  const [retrospectiveName, setRetrospectiveName] = useState(
    retrospective.name,
  );

  return (
    <Sidebar>
      <div className="w-[384px] z-50 bg-white h-full shadow-md border-l fixed top-0 right-0 overflow-y-auto p-6">
        <div className="flex justify-between">
          <p className="text-sm font-black">Settings</p>
          <Image
            className="h-6 w-6 cursor-pointer"
            src={x}
            alt="x"
            onClick={() => setShowSettingsBar(false)}
          ></Image>
        </div>
        <div className="text-base w-full shadow-sm text-black font-semibold mt-4 border border-[#E4E4E7] rounded-md">
          <div className="w-full flex flex-col p-3 pb-0 space-y-4">
            <div className="bg-gray-100 p-2 space-y-2 ">
              <div className="flex justify-between text-[#71717A] text-xs font-normal">
                <p className="">Board Name</p>
                <p>{retrospectiveName.length} / 66</p>
              </div>

              <input
                disabled={!isSuperAdmin}
                maxLength={66}
                value={retrospectiveName}
                onChange={(e) => setRetrospectiveName(e.target.value)}
                className="w-full bg-transparent border-b outline-none focus:border-b border-orange-500"
              />
              <div className="flex justify-end">
                <If condition={isSuperAdmin}>
                  <button
                    onClick={() => {
                      onUpdateRetrospectiveSettings(
                        'name',
                        lockedBoard,
                        retrospectiveName,
                      );
                    }}
                    className="shadow-sm hover:bg-gray-50 bg-white py-2 px-4 rounded-md text-sm font-medium"
                  >
                    Save
                  </button>
                </If>
              </div>
            </div>
            <div className="bg-[#E4E4E7] h-px w-full"></div>
          </div>
          <div className="px-3 pb-3 mt-4">
            <div className="bg-gray-100 p-1">
              <p className="font-normal text-[#71717A] text-sm mt-4">
                Votes per participants (20 Max)
              </p>
              <div className="flex space-x-2 justify-between mt-2.5 w-full">
                <input
                  min={totalVotes}
                  max={20}
                  disabled={!isSuperAdmin}
                  value={voteNumber}
                  onChange={(e) => {
                    let inputValue = parseInt(e.target.value);

                    if (inputValue < 1) {
                      inputValue = 1;
                    }

                    if (inputValue > 20) {
                      inputValue = 20;
                    }

                    setVoteNumber(inputValue);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onUpdateRetrospectiveSettings(
                        'name',
                        lockedBoard,
                        retrospectiveName,
                      );
                    }
                  }}
                  className="shadow-sm border py-2 px-3 rounded-md w-full text-sm font-normal"
                  type="number"
                ></input>
                <button
                  disabled={!isSuperAdmin}
                  onClick={() => {
                    if (isNaN(voteNumber)) {
                      onUpdateBoardSettings('votes', 0, 'sidebar');
                    } else {
                      if (voteNumber >= totalVotes) {
                        onUpdateBoardSettings('votes', voteNumber, 'sidebar');
                      } else {
                        toast.error(
                          "You can't set votes less than " + totalVotes,
                        );
                      }
                    }
                  }}
                  className="shadow-sm hover:bg-gray-50 bg-white py-2 px-4 rounded-md text-sm font-medium"
                >
                  Confirm
                </button>
              </div>
              <div className="bg-[#E4E4E7] my-4 h-px w-full"></div>
              <div className="space-y-6">
                <div className="flex text-sm justify-between">
                  <p>Show author of comments</p>
                  <div className="flex items-center justify-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          setShowAuthors(!showAuthors);
                          const value = !showAuthors;
                          if (isSuperAdmin) {
                            onUpdateBoardSettings(
                              'authors',
                              !showAuthors,
                              'sidebar',
                            );
                          } else {
                            if (value) {
                              toaster.success('Show author comments');
                            } else {
                              toaster.success('Hide author comments');
                            }
                          }
                        }}
                        checked={showAuthors}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>
                </div>
                <div className="flex text-sm justify-between">
                  <p>Hide comment cards from members</p>
                  <div className="flex items-center justify-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          setShowMembersComment(!showMembersComment);
                          const value = !showMembersComment;
                          if (isSuperAdmin) {
                            onUpdateRetrospectiveSettings(
                              'allowMembersViewComments',
                              !showMembersComment,
                              retrospectiveName,
                            );
                          } else {
                            if (value) {
                              toaster.success('Show Comments to members');
                            } else {
                              toaster.success('Hide Comments from members');
                            }
                          }
                        }}
                        checked={!showMembersComment}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>
                </div>
                <div className="flex text-sm justify-between">
                  <p>Lock board</p>
                  <div className="flex items-center justify-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          setLockedBoard(!lockedBoard);
                          const value = !lockedBoard;
                          if (isSuperAdmin) {
                            onUpdateRetrospectiveSettings(
                              'lock',
                              !lockedBoard,
                              retrospectiveName,
                            );
                          } else {
                            toaster.success(
                              value ? 'Locked board' : 'Unlock board',
                            );
                          }
                        }}
                        checked={lockedBoard}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>
                </div>
                <div className="flex text-sm justify-between">
                  <p className={'text-black'}>Make board Private</p>
                  <div className="flex items-center justify-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAccessType('private');
                            if (isSuperAdmin) {
                              onUpdateRetrospectiveSettings(
                                'access',
                                'private',
                                retrospectiveName,
                              );
                            } else {
                              toaster.success('Make board private');
                            }
                          } else {
                            setAccessType('public');
                            if (isSuperAdmin) {
                              onUpdateRetrospectiveSettings(
                                'access',
                                'public',
                                retrospectiveName,
                              );
                            } else {
                              toaster.success('Make board public');
                            }
                          }
                        }}
                        disabled={loading}
                        checked={
                          accessType === 'private' || accessType === 'team'
                        }
                        className="sr-only peer"
                      />
                      <div className="disabled:peer-checked:bg-orange-200 w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>
                </div>
                <div className="flex text-sm justify-between">
                  <p className={'text-black'}>Use Ai to group comments</p>
                  <div className="flex items-center justify-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setUseGroupWithAI(true);
                            toaster.success('Use Ai to group comments');
                          } else {
                            setUseGroupWithAI(false);
                            toaster.success('Remove Ai for comment');
                          }
                        }}
                        disabled={loading}
                        checked={useGroupWithAI === true}
                        className="sr-only peer"
                      />
                      <div className="disabled:peer-checked:bg-orange-200 w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>
                </div>
                <div className="flex text-sm justify-between">
                  <p className={'text-black'}>Use Ai for Actions Items</p>
                  <div className="flex items-center justify-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setUseActionsWithAI(true);
                            toaster.success('Use Ai for Actions Items');
                          } else {
                            setUseActionsWithAI(false);
                            toaster.success('Remove Ai for Action items');
                          }
                        }}
                        disabled={loading}
                        checked={useActionsWithAI === true}
                        className="sr-only peer"
                      />
                      <div className="disabled:peer-checked:bg-orange-200 w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
