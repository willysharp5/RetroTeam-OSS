import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from 'reactfire';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useUserSession } from '~/core/hooks/use-user-session';

import ProfileDropdown from '~/components/ProfileDropdown';

import Logo from '../../../../public/assets/svg/LogoText.svg';
import userPlus from 'public/assets/svg/user-plus-3.svg';
import timer from 'public/assets/svg/timer.svg';

import { useCurrentOrganization } from '~/lib/organizations/hooks/use-current-organization';
import MembersSidebar from '~/components/shared/membersSidebar';
import TimerSidebar from '~/components/shared/timerSidebar';
import { useFetchInvitedMembers } from '~/lib/board/hooks/use-fetch-invited-members';
import configuration from '~/configuration';
import toaster from 'react-hot-toast';
import { useInviteBoardMembers } from '~/lib/board/hooks/use-invite-board-members';
import { useDeleteInvite } from '~/lib/board/hooks/use-delete-invite';
import { useTranslation } from 'react-i18next';
import { useGetBoardByRetrospectiveId } from '~/lib/board/hooks/use-get-board-by-retrospective';
import { useActivateBoardMember } from '~/lib/board/hooks/use-deactivate-member';
import { TeamMembers } from '~/lib/teams/types/teams';
import { useUpdateRoleBoardMember } from '~/lib/board/hooks/use-update-role-members';
import If from '~/core/ui/If';
import { MembershipRole } from '~/lib/organizations/types/membership-role';
import useFetchOrganizationMembers from '~/lib/server/organizations/get-members';

interface IcebreakerHeaderProps {
  showMembersSidebar: boolean;
  setShowMembersSidebar: (show: boolean) => void;
  acceptMemberToBoard: (userId: string, accept: boolean, toastId: any) => void;
  minute: any;
  setMinute: (minute: any) => void;
  second: any;
  setSecond: (second: any) => void;
  sound: any;
  setSound: (sound: any) => void;
  setPlay: (play: boolean) => void;
  setPause: (pause: boolean) => void;
  setShowPlayModal: (show: boolean) => void;
  currentUserRole: number;
  requests: any;
  showTimerSidebar: boolean;
  setShowTimerSidebar: (show: boolean) => void;
}

const MobileNavigation = dynamic(() => import('~/components/MobileNavigation'));

const IcebreakerHeader: React.FCC<IcebreakerHeaderProps> = ({
  setShowPlayModal,
  minute,
  setMinute,
  second,
  setSecond,
  sound,
  setSound,
  setPlay,
  setPause,
  showMembersSidebar,
  setShowMembersSidebar,
  requests,
  currentUserRole,
  acceptMemberToBoard,
  showTimerSidebar,
  setShowTimerSidebar,
}) => {
  const userSession = useUserSession();
  const auth = useAuth();
  const currentUser = auth.currentUser;

  const organization = useCurrentOrganization();
  const organizationId = organization?.id as string;

  const router = useRouter();
  const { id } = router.query;

  const retrospectiveId = id as string;

  const { t } = useTranslation('organization');

  const [removedMembers, setRemovedMembers] = useState<TeamMembers[]>([]);

  const {
    retrospective,
    members = [],
    fetchBoard,
  } = useGetBoardByRetrospectiveId(organizationId, retrospectiveId);

  const [access, setAccess] = useState('');
  const [boardMembers, setBoardMembers] = useState<TeamMembers[]>([]);

  const [totalFacilitators, setTotalFacilitators] = useState(0);

  function copyURLink() {
    let siteUrl = configuration.site.siteUrl;

    assertSiteUrl(siteUrl);

    const url = retrospectiveId
      ? `${siteUrl}/board/${retrospectiveId}`
      : `${siteUrl}/icebreaker`;

    navigator.clipboard
      .writeText(url)
      .then(() => {
        toaster.success('Copied to clipboard');
      })
      .catch((error) => {
        console.log(error);
        toaster.error('Something went wrong');
      });
  }
  // Members function

  useEffect(() => {
    if (retrospective) {
      setAccess(retrospective?.access?.type);
    }
    if (members) {
      setBoardMembers(members);
      const activeMembers = members.filter(
        (member: TeamMembers) => member.active === true,
      );

      const facilitatorMembers = activeMembers.filter(
        (member: TeamMembers) => member.role > 0,
      );
      const totalFacilitators = facilitatorMembers.length;
      setTotalFacilitators(totalFacilitators);
    }
  }, [retrospective, members]);

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

  const user = useUserSession();
  const facilitator = user?.data?.name + ' ' + user?.data?.lastName;

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
          console.log(e);
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
          console.log(e);
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
          console.log(e);
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
        console.log(error);
        toaster.error('Something went wrong');
      });
  }

  const { members: membersData } = useFetchOrganizationMembers(
    organizationId,
    10,
    false,
  );

  if (!organization) {
    return null;
  }

  return (
    <>
      <div className="flex sticky items-center justify-between border-b border-[#E4E4E7] pb-3 px-8 py-6 tv:px-36">
        <div className={'flex items-center '}>
          <div className={'flex items-center lg:hidden'}>
            <MobileNavigation />
          </div>

          <div className={'hidden md:flex items-center lg:space-x-4'}>
            <div className="flex">
              <Image alt="logo" width={207} src={Logo}></Image>
            </div>
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
        <div className={'flex items-center justify-center space-x-4'}>
          <If
            condition={
              currentUserRole === MembershipRole.Facilitator &&
              !user?.auth?.isAnonymous
            }
          >
            <button onClick={() => setShowTimerSidebar(true)}>
              <Image src={timer} alt="timer"></Image>
            </button>
          </If>

          <If condition={currentUserRole === MembershipRole.Facilitator}>
            <button onClick={() => setShowMembersSidebar(true)}>
              <Image src={userPlus} alt="userPlus"></Image>
            </button>
          </If>

          <ProfileDropdown
            user={userSession}
            signOutRequested={() => auth.signOut()}
          />
        </div>
      </div>
      {showMembersSidebar && (
        <div className="absolute">
          <MembersSidebar
            setShowMembersSidebar={setShowMembersSidebar}
            organizationId={organization.id}
            URLink={
              retrospectiveId ? `board/${retrospectiveId}` : `/icebreaker`
            }
            copyToClipBoard={copyURLink}
            updateMemberRole={onUpdateRoleMemberRequested}
            removeMember={onRemoveMemberRequested}
            onInvite={trigger}
            loading={isMutating}
            activeMembers={retrospectiveId ? boardMembers : membersData}
            totalFacilitators={totalFacilitators}
            submitAction={refetch}
            body={body}
            removedMembers={removedMembers}
            pendingInvites={pendingInvites}
            resend={onResend}
            deleteInvite={onInviteDeleteRequested}
            copyInviteToClipBoard={getInvitePageFullUrl}
            currentUserRole={currentUserRole}
            requests={requests}
            acceptMemberToBoard={acceptMemberToBoard}
            isBoard={retrospectiveId ? true : false}
          />
        </div>
      )}
      {showTimerSidebar && (
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
    </>
  );
};

export default IcebreakerHeader;
