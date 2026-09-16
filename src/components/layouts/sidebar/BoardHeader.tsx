import { useCallback, useEffect, useMemo, useState } from 'react';
import toaster from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useUserSession } from '~/core/hooks/use-user-session';

import ProfileDropdown from '~/components/ProfileDropdown';
import SettingsSidebar from '~/components/board/sideBars/settingsSidebar';
import MembersSidebar from '~/components/shared/membersSidebar';
import TimerSidebar from '~/components/shared/timerSidebar';

import Logo from '../../../../public/assets/svg/LogoText.svg';
import arrowRight from 'public/assets/svg/chevron-right.svg';
import userPlus from 'public/assets/svg/user-plus-3.svg';
import settings from 'public/assets/svg/settings.svg';
import timer from 'public/assets/svg/timer.svg';
import caret from 'public/assets/images/caret-left.png';
import caretRight from 'public/assets/images/caret-right.png';
import download from 'public/assets/svg/download-orange.svg';
import icebreaker from 'public/assets/svg/ice-cream.svg';

import { useFetchInvitedMembers } from '~/lib/board/hooks/use-fetch-invited-members';
import { useInviteBoardMembers } from '~/lib/board/hooks/use-invite-board-members';
import { useDeleteInvite } from '~/lib/board/hooks/use-delete-invite';
import { useActivateBoardMember } from '~/lib/board/hooks/use-deactivate-member';
import { TeamMembers } from '~/lib/teams/types/teams';
import { useUpdateRoleBoardMember } from '~/lib/board/hooks/use-update-role-members';
import { RequestsBoard } from '~/lib/board/types/membership-role';

import { useUpdateRetrospectiveSettings } from '~/lib/retrospectives/hooks/use-update-retrospective-settings';

import configuration from '~/configuration';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/core/ui/Tooltip';
import ResultsSidebar from '~/components/board/sideBars/resultsSidebar';
import BoardMobileNavigation from '~/components/BoardMobileNavigation';
import If from '~/core/ui/If';
import Cookies from 'js-cookie';
import { MembershipRole } from '~/lib/organizations/types/membership-role';
import isMobile from '~/components/utils/deviceDetecter';
import { Group } from '~/lib/board/types/types';
import ConfirmationModal from '~/components/shared/confirmationModal';
import useUpdateGroup from '~/lib/board/hooks/use-update-group';

interface BoardHeaderProps {
  organization: any;
  selectedTab: number;
  setSelectedTab: (tab: number) => void;
  showMembersSidebar: boolean;
  setShowMembersSidebar: (show: boolean) => void;
  retrospective: any;
  members: TeamMembers[];
  fetchBoard: () => void;
  requests: RequestsBoard[];
  acceptMemberToBoard: (userId: string, accept: boolean, toastId: any) => void;
  minute: any;
  setMinute: (minute: any) => void;
  second: any;
  setSecond: (second: any) => void;
  sound: any;
  setSound: (sound: any) => void;
  setPlay: (play: boolean) => void;
  setPause: (pause: boolean) => void;
  currentUserRole: number;
  onUpdateBoardSettings: (type: string, value: any, from: string) => void;
  voteNumber: number;
  setVoteNumber: (number: number) => void;
  totalVotes: number;
  organizationId: string;
  aiRemaining: number;
  auth: any;
  onUpdateIcebreakerRequested: (type: string, value: any) => void;
  groups: Group[];
  teamId: string;
}

const BoardHeader: React.FC<BoardHeaderProps> = ({
  selectedTab,
  setSelectedTab,
  showMembersSidebar,
  setShowMembersSidebar,
  retrospective,
  members,
  fetchBoard,
  requests,
  acceptMemberToBoard,
  minute,
  setMinute,
  second,
  setSecond,
  sound,
  setSound,
  setPlay,
  setPause,
  currentUserRole,
  onUpdateBoardSettings,
  voteNumber,
  setVoteNumber,
  totalVotes,
  organization,
  organizationId,
  aiRemaining,
  auth,
  onUpdateIcebreakerRequested,
  groups,
  teamId,
}) => {
  const userSession = useUserSession();
  const facilitator =
    userSession?.data?.name + ' ' + userSession?.data?.lastName;

  const user = auth.currentUser;

  const router = useRouter();
  const { id } = router.query;

  const retrospectiveId = id as string;

  const { t } = useTranslation('organization');

  const [showSettingsBar, setShowSettingsBar] = useState(false);
  const [showTimerSidebar, setShowTimerSidebar] = useState(false);
  const [showResultsSidebar, setShowResultsSidebar] = useState(false);

  const [access, setAccess] = useState('');
  const [boardMembers, setBoardMembers] = useState<TeamMembers[]>([]);
  const [removedMembers, setRemovedMembers] = useState<TeamMembers[]>([]);

  const [loading, setLoading] = useState(false);

  const [totalFacilitators, setTotalFacilitators] = useState(0);

  function copyURLink() {
    let siteUrl = configuration.site.siteUrl;

    assertSiteUrl(siteUrl);

    const url = `${siteUrl}/board/${retrospectiveId}`;

    navigator.clipboard
      .writeText(url)
      .then(() => {
        toaster.success('Copied to clipboard');
      })
      .catch((error) => {
        console.error('Error on copyURLink' + error);
        toaster.error('Something went wrong');
      });
  }
  // Members function

  const [areMembersSet, setAreMembersSet] = useState(false);

  useEffect(() => {
    if (retrospective) {
      setAccess(retrospective.access?.type);
    }

    if (members.length > 0) {
      const activeMembers = members.filter(
        (member: TeamMembers) => member.active === true,
      );
      setBoardMembers(activeMembers);

      const removedMembers = members.filter(
        (member: TeamMembers) => member.active === false,
      );
      setRemovedMembers(removedMembers);

      const facilitatorMembers = activeMembers.filter(
        (member: TeamMembers) => member.role > 0,
      );
      const totalFacilitators = facilitatorMembers.length;
      setTotalFacilitators(totalFacilitators);

      setAreMembersSet(true);
    }
  }, [retrospective, members, areMembersSet]);

  const removeMemberRequest = useActivateBoardMember();

  const updateMemberRole = useUpdateRoleBoardMember();

  const updateRetrospectiveSettings = useUpdateRetrospectiveSettings();

  const onUpdateRetrospectiveSettings = useCallback(
    (type: string, value: any, name: string) => {
      void (async () => {
        try {
          const promise = updateRetrospectiveSettings(
            organizationId,
            retrospectiveId,
            type,
            value,
            name,
          );

          const messages = {
            lock: value ? 'Locked board' : 'Unlock board',
            access:
              value === 'private' ? 'Make board private' : 'Make board public',
            name: 'Board name saved',
            ai: value ? 'Use Ai to group comments' : 'Remove Ai for comment',
            'ai-actions': value
              ? 'Use Ai for Actions Items'
              : 'Remove Ai for Action items',
            allowMembersViewComments: value
              ? 'Show Comments to members'
              : 'Hide Comments from members',
            default: 'Settings have been updated',
          } as any;

          const successMessage = messages[type] || messages.default;

          if (type === 'access') {
            setLoading(true);
          }

          await toaster.promise(promise, {
            loading: 'Updating settings',
            success: successMessage,
            error: 'Error updating settings',
          });

          if (type === 'access') {
            setTimeout(() => {
              setLoading(false);
              fetchBoard();
            }, 500);
          } else {
            fetchBoard();
          }
        } catch (e) {
          console.error('Error on onUpdateRetrospectiveSettings' + e);
          setLoading(false);
        }
      })();
    },
    [updateRetrospectiveSettings, organizationId, retrospectiveId, fetchBoard],
  );

  const onUpdateRoleMemberRequested = useCallback(
    (userId: string, role: number) => {
      void (async () => {
        try {
          const promise = updateMemberRole(
            organizationId,
            retrospectiveId,
            userId,
            role,
            facilitator,
          );
          await toaster.promise(promise, {
            loading: 'Updating role member',
            success: 'Member role has been updated',
            error: 'Error updating role member',
          });

          fetchBoard();
        } catch (e) {
          console.error('Error on onUpdateRoleMemberRequested' + e);
        }
      })();
    },
    [
      organizationId,
      retrospectiveId,
      fetchBoard,
      updateMemberRole,
      facilitator,
    ],
  );

  const onRemoveMemberRequested = useCallback(
    (userId: string, activate: boolean) => {
      void (async () => {
        try {
          const promise = removeMemberRequest(
            organizationId,
            retrospectiveId,
            userId,
            activate,
            facilitator,
          );

          if (activate) {
            await toaster.promise(promise, {
              loading: 'Activating member',
              success: 'Member has been activated',
              error: 'Error activating member',
            });
          } else {
            await toaster.promise(promise, {
              loading: 'Deactivating member',
              success: 'Member has been deactivated',
              error: 'Error deactivating member',
            });
          }
          fetchBoard();
        } catch (e) {
          console.error('Error on onRemoveMemberRequested' + e);
        }
      })();
    },
    [
      removeMemberRequest,
      organizationId,
      retrospectiveId,
      fetchBoard,
      facilitator,
    ],
  );

  // Invitation functions

  const { data: pendingInvites, refetch } = useFetchInvitedMembers(
    organizationId,
    retrospectiveId,
  );

  const body = {
    organizationId: organizationId,
    type: access,
  };

  const { trigger, isMutating } = useInviteBoardMembers(retrospectiveId);

  const onResend = useCallback(
    async (invitation: any) => {
      const body = {
        organizationId: organizationId,
        type: access,
        members: [
          {
            email: invitation.email,
            role: invitation.role,
            facilitator: facilitator,
          },
        ],
      } as any;

      const promise = trigger(body);

      await toaster.promise(promise, {
        success: 'Invitation resent',
        error: t(`inviteMembersError`),
        loading: `Resending invitation`,
      });
    },
    [trigger, t, facilitator, access, organizationId],
  );

  const deleteRequest = useDeleteInvite();

  const onInviteDeleteRequested = useCallback(
    (code: string) => {
      void (async () => {
        try {
          const promise = deleteRequest(organizationId, retrospectiveId, code);

          await toaster.promise(promise, {
            success: t(`deleteInviteSuccessMessage`),
            error: t(`deleteInviteErrorMessage`),
            loading: t(`deleteInviteLoadingMessage`),
          });
          refetch();
        } catch (e) {
          console.error('Error onInviteDeleteRequested' + e);
        }
      })();
    },
    [deleteRequest, organizationId, retrospectiveId, t, refetch],
  );

  function assertSiteUrl(siteUrl: Maybe<string>): asserts siteUrl is string {
    if (!siteUrl && configuration.production) {
      throw new Error(
        `Please configure the "siteUrl" property in the configuration file ~/configuration.ts`,
      );
    }
  }

  function getInvitePageFullUrl(code: string) {
    let siteUrl = configuration.site.siteUrl;

    assertSiteUrl(siteUrl);

    const url = [siteUrl, 'auth', 'invite', 'board', code].join('/');

    navigator.clipboard
      .writeText(url)
      .then(() => {
        toaster.success('Copied to clipboard');
      })
      .catch((error) => {
        console.log('Error getInvitePageFullUrl' + error);
        toaster.error('Something went wrong');
      });
  }
  const navigationMenu = [
    {
      action: () => router.push('/dashboard'),
      name: 'Dashboard',
    },
    ...(currentUserRole === MembershipRole.Facilitator
      ? [
          {
            action: async () => {
              {
                await onUpdateIcebreakerRequested(
                  'href',
                  `/icebreaker?id=${retrospectiveId}`,
                );
                router.push(`/icebreaker?id=${retrospectiveId}`);
              }
            },
            name: 'Icebreaker',
          },
        ]
      : []),
    ...(selectedTab !== 4 && currentUserRole === MembershipRole.Facilitator
      ? [
          {
            action: () => {
              setShowTimerSidebar(true), setPause(true);
            },
            name: 'Timer',
          },
        ]
      : []),

    ...(currentUserRole === MembershipRole.Facilitator
      ? [
          {
            action: () => {
              setShowSettingsBar(true);
            },
            name: 'Settings',
          },
        ]
      : []),
    ...(currentUserRole === MembershipRole.Facilitator
      ? [
          {
            action: () => setShowMembersSidebar(true),
            name: 'Invite Members',
          },
        ]
      : []),
    ...(retrospective?.finished
      ? [
          {
            action: () => setShowResultsSidebar(true),
            name: 'Download',
          },
        ]
      : []),
  ];

  const isScreenMobile = isMobile();

  if (!organization) {
    return null;
  }

  return (
    <>
      {(showSettingsBar ||
        showTimerSidebar ||
        showResultsSidebar ||
        showMembersSidebar) && (
        <div className="fixed top-0 left-0 w-full h-full bg-black opacity-20 z-10 pointer-events-auto "></div>
      )}
      <div
        className={`flex ${
          isScreenMobile && 'pt-8'
        }  space-y-2 md:space-y-0 flex-col md:flex-row items-center justify-start md:justify-between py-3 px-4`}
      >
        <div className="flex items-center w-full">
          <div className="flex items-center lg:hidden">
            {retrospective && (
              <BoardMobileNavigation
                navigation={navigationMenu}
                accessType={retrospective.access.type}
                role={currentUserRole}
                isLocked={retrospective.locked}
                aiRemaining={aiRemaining}
              />
            )}
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex">
              <Image alt="logo" width={207} src={Logo}></Image>
            </div>
            <div className="flex w-full items-center ml-12">
              <Link
                href="/dashboard"
                className="text-sm border rounded px-2 py-x hover:bg-gray-50"
              >
                <p>Dashboard</p>
              </Link>
            </div>
          </div>
        </div>
        <div className="flex justify-center w-full">
          <TopMenuTabs
            setPlay={setPlay}
            selectedTab={selectedTab}
            setSelectedTab={setSelectedTab}
            setMinute={setMinute}
            setSecond={setSecond}
            retrospective={retrospective}
            currentUserRole={currentUserRole}
            groups={groups}
            organizationId={organizationId}
            retrospectiveId={retrospectiveId}
            onUpdateRoleMemberRequested={onUpdateIcebreakerRequested}
          />
        </div>
        <div className="hidden md:flex items-center md:justify-end w-full space-x-4">
          <If condition={currentUserRole === MembershipRole.Facilitator}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="cursor-pointer"
                  onClick={async () => {
                    try {
                      await onUpdateIcebreakerRequested(
                        'href',
                        `/icebreaker?id=${retrospectiveId}`,
                      );
                      Cookies.remove('startBoard');
                    } catch (error) {
                      console.error(
                        'Error updating icebreaker or navigating:',
                        error,
                      );
                    }
                  }}
                >
                  <Image src={icebreaker} alt="icebreaker" />
                </div>
              </TooltipTrigger>
              <TooltipContent>Icebreaker</TooltipContent>
            </Tooltip>
          </If>

          <If condition={retrospective?.finished}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="cursor-pointer"
                  onClick={() => setShowResultsSidebar(true)}
                >
                  <Image src={download} alt="download" />
                </div>
              </TooltipTrigger>
              <TooltipContent>Download</TooltipContent>
            </Tooltip>
          </If>

          <If condition={currentUserRole === MembershipRole.Facilitator}>
            <>
              <If condition={selectedTab !== 4 && !user?.isAnonymous}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="cursor-pointer"
                      onClick={() => {
                        setShowTimerSidebar(true);
                        setPause(true);
                      }}
                    >
                      <Image src={timer} alt="timer" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Timer</TooltipContent>
                </Tooltip>
              </If>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="cursor-pointer"
                    onClick={() => setShowSettingsBar(true)}
                  >
                    <Image src={settings} alt="settings" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>Settings</TooltipContent>
              </Tooltip>
            </>
          </If>

          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="cursor-pointer"
                onClick={() => setShowMembersSidebar(true)}
              >
                <Image src={userPlus} alt="userPlus" />
              </div>
            </TooltipTrigger>
            <TooltipContent>Manage Users</TooltipContent>
          </Tooltip>

          <ProfileDropdown
            user={userSession}
            signOutRequested={() => auth.signOut()}
          />
        </div>

        {showSettingsBar && retrospective && (
          <div className="absolute">
            <SettingsSidebar
              setShowSettingsBar={setShowSettingsBar}
              authors={retrospective.authors}
              showMembersComments={retrospective.allowMembersViewComments}
              locked={retrospective.locked}
              groupWithAI={retrospective.groupWithAI}
              actionsWithAI={retrospective.actionsWithAI}
              onUpdateBoardSettings={onUpdateBoardSettings}
              onUpdateRetrospectiveSettings={onUpdateRetrospectiveSettings}
              access={retrospective.access.type}
              retrospective={retrospective}
              voteNumber={voteNumber}
              setVoteNumber={setVoteNumber}
              totalVotes={totalVotes}
              loading={loading}
            />
          </div>
        )}
        {showMembersSidebar && (
          <div className="absolute">
            <MembersSidebar
              setShowMembersSidebar={setShowMembersSidebar}
              organizationId={organizationId}
              URLink={`board/${retrospectiveId}`}
              copyToClipBoard={copyURLink}
              updateMemberRole={onUpdateRoleMemberRequested}
              removeMember={onRemoveMemberRequested}
              onInvite={trigger}
              loading={isMutating}
              activeMembers={boardMembers}
              removedMembers={removedMembers}
              totalFacilitators={totalFacilitators}
              submitAction={refetch}
              body={body}
              requests={requests}
              acceptMemberToBoard={acceptMemberToBoard}
              pendingInvites={pendingInvites}
              resend={onResend}
              deleteInvite={onInviteDeleteRequested}
              copyInviteToClipBoard={getInvitePageFullUrl}
              currentUserRole={currentUserRole}
              isBoard={true}
            />
          </div>
        )}
        {showTimerSidebar && selectedTab !== 4 && (
          <div className="absolute">
            <TimerSidebar
              organizationId={organizationId}
              retrospectiveId={retrospectiveId}
              setShowTimerSidebar={setShowTimerSidebar}
              minute={minute}
              setMinute={setMinute}
              second={second}
              setSecond={setSecond}
              setSound={setSound}
              sound={sound}
              setPlay={setPlay}
              setPause={setPause}
            />
          </div>
        )}
        {showResultsSidebar && (
          <ResultsSidebar
            setShowResultsBar={setShowResultsSidebar}
            retrospective={retrospective}
            organizationId={organizationId}
            teamId={teamId}
            userId={user.uid as string}
            onUpdateBoardSettings={onUpdateBoardSettings}
          />
        )}
      </div>
    </>
  );
};

function TopMenuTabs({
  selectedTab,
  setSelectedTab,
  setPlay,
  setMinute,
  setSecond,
  retrospective,
  currentUserRole,
  groups,
  organizationId,
  retrospectiveId,
  onUpdateRoleMemberRequested,
}: any) {
  const [showInfoModal, setShowInfoModal] = useState(false);

  const handleClick = async (tabIndex: number) => {
    const hasAiGrouped = groups.some((group: any) => group.aiGroup);
    if (hasAiGrouped) {
      setShowInfoModal(true);
    } else {
      if (
        tabIndex === 2 &&
        selectedTab !== 1 &&
        selectedTab !== 3 &&
        selectedTab !== 4
      ) {
        return;
      } else if (tabIndex === 3 && selectedTab !== 2 && selectedTab !== 4) {
        return;
      } else if (tabIndex === 4 && selectedTab !== 3) {
        return;
      }
      setPlay(false);
      setMinute('05');
      setSecond('00');
      setSelectedTab(tabIndex);
      await onUpdateRoleMemberRequested('status', tabIndex);
    }
  };

  const navigate = async (type: string) => {
    const hasAiGrouped = groups.some((group: any) => group.aiGroup);
    if (hasAiGrouped) {
      setShowInfoModal(true);
    } else {
      if (type === 'forward') {
        if (selectedTab < 4) {
          const set = selectedTab + 1;
          setSelectedTab(set);
          await onUpdateRoleMemberRequested('status', set);
        }
      } else {
        if (selectedTab > 1) {
          const set = selectedTab - 1;
          setSelectedTab(set);
          await onUpdateRoleMemberRequested('status', set);
        }
      }
    }
  };

  const isNavigationDisabled = currentUserRole === MembershipRole.Member;

  const { trigger: updateGroupData } = useUpdateGroup();

  async function confirmAIGrouping(group: any) {
    const body = {
      id: group.id,
      name: group.name || 'Group Title',
      organizationId,
      retrospectiveId,
      comments: group.comments,
      status: group.status,
      order: group.order,
      aiGroup: false,
      votes: group.votes || 0,
      voters: group.voters || [],
      tags: group.tags,
    };
    const _groups = [...groups];
    const groupIndex = _groups.findIndex((item: any) => item.id === group.id);
    _groups[groupIndex] = { ...group, aiGroup: false };
    const promise = updateGroupData(body)
      .then((res: any) => {
        if (res.success) {
          // setGroups(_groups);
        }
      })
      .catch((e: any) => {
        console.error('ERROR confirmAIGrouping', e);
      });
    await toaster.promise(promise, {
      loading: 'Grouping comments',
      success: 'Comments has been grouped',
      error: 'Error grouping comments',
    });
  }

  const confirmAllAIGrouping = () => {
    const unconfirmedGroups = groups.filter((group: any) => group.aiGroup);

    unconfirmedGroups.forEach((group: Group) => {
      confirmAIGrouping(group);
    });

    setShowInfoModal(false);
  };

  return (
    <div
      className={`text-xs md:text-sm ${'md:flex justify-between md:space-y-0 space-y-5'}`}
    >
      {showInfoModal && (
        <ConfirmationModal
          showModal={showInfoModal}
          message="Do you want all Ai grouping to be automatically accepted?"
          setShowModal={setShowInfoModal}
          confirmMessage="Yes"
          cancelMessage="No"
          confirmAction={confirmAllAIGrouping}
        ></ConfirmationModal>
      )}
      <div className="flex space-x-2">
        <div className="space-y-1">
          <p className="text-orange-500 text-sm font-bold text-center">
            {retrospective?.name}
          </p>
          <div className="flex overflow-x-hidden flex-wrap  text-zinc-400 bg-zinc-100 rounded-lg p-1 ">
            <button
              disabled={isNavigationDisabled}
              className={`flex space-x-2.5 py-1 px-3 rounded-sm ${
                selectedTab === 1 ? 'bg-white text-black' : ''
              } hover:bg-zinc-50 hover:text-zinc-500 transition cursor-pointer disabled:hover:bg-transparent`}
              onClick={() => handleClick(1)}
            >
              {selectedTab === 1 ? (
                <>
                  <p> 1 - Capture</p>
                  <Image src={arrowRight} alt="arrowRight"></Image>
                </>
              ) : (
                <div>
                  <p>Capture</p>
                </div>
              )}
            </button>
            <button
              disabled={isNavigationDisabled}
              className={`flex space-x-2.5 py-1 px-3 rounded-sm ${
                selectedTab === 2 ? 'bg-white text-zinc-600' : ''
              } hover:bg-zinc-50 hover:text-zinc-500 disabled:hover:bg-transparent  transition cursor-pointer`}
              onClick={() => handleClick(2)}
            >
              {selectedTab === 2 ? (
                <>
                  <p> 2 - Group</p>
                  <Image src={arrowRight} alt="arrowRight"></Image>
                </>
              ) : (
                <div>
                  <p>Group</p>
                </div>
              )}
            </button>
            <button
              disabled={isNavigationDisabled}
              className={`flex space-x-2.5 py-1 px-3 rounded-sm ${
                selectedTab === 3 ? 'bg-white text-zinc-600' : ''
              } hover:bg-zinc-50 hover:text-zinc-500 disabled:hover:bg-gray-100 transition cursor-pointer`}
              onClick={() => handleClick(3)}
            >
              {selectedTab === 3 ? (
                <>
                  <p> 3 - Vote</p>
                  <Image src={arrowRight} alt="arrowRight"></Image>
                </>
              ) : (
                <div>
                  <p>Vote</p>
                </div>
              )}
            </button>
            <button
              disabled={isNavigationDisabled}
              className={`flex space-x-2.5 py-1 px-3 rounded-sm ${
                selectedTab === 4 ? 'bg-white text-zinc-600' : ''
              } hover:bg-zinc-50 hover:text-zinc-500 disabled:hover:bg-gray-100 transition cursor-pointer`}
              onClick={() => handleClick(4)}
            >
              {selectedTab === 4 ? (
                <>
                  <p> 4 - Actions</p>
                  <Image src={arrowRight} alt="arrowRight"></Image>
                </>
              ) : (
                <div>
                  <p>Actions</p>
                </div>
              )}
            </button>
          </div>
        </div>
        <If condition={!isNavigationDisabled}>
          <div
            className={`
            ${
              currentUserRole > 0 && 'mt-6'
            } hidden md:flex space-x-2 items-center`}
          >
            <button
              className="border border-[#f97316FF]"
              onClick={() => navigate('backwards')}
            >
              <Image src={caret} alt="caret" />
            </button>
            <button
              className="border border-[#f97316FF]"
              onClick={() => navigate('forward')}
            >
              <Image src={caretRight} alt="caretRight" />
            </button>
          </div>
        </If>
      </div>
    </div>
  );
}

export default BoardHeader;
