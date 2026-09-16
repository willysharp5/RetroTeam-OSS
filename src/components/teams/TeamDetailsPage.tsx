import {
  useState,
  useEffect,
  useCallback,
  FormEventHandler,
  useRef,
} from 'react';
import toaster, { toast } from 'react-hot-toast';
import { Trans, useTranslation } from 'react-i18next';
import { useAuth } from 'reactfire';

import trash from 'public/assets/svg/trash.svg';
import edit from 'public/assets/svg/edit-3.svg';
import add from '/public/assets/svg/user-plus-2.svg';
import x from '/public/assets/svg/x.svg';
import users from 'public/assets/svg/users.svg';
import ChevronDownIcon from 'public/assets/svg/caret-sort.svg';
import arrowLeft from 'public/assets/svg/arrow-left-black.svg';
import copy from 'public/assets/svg/copy.svg';
import send from 'public/assets/svg/send_gray.svg';
import archiveRestore from '/public/assets/svg/eye-open.svg';
import deactivate from '/public/assets/svg/eye-off.svg';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

import Modal from '../shared/modal';
import AddTeamScreen from './AddTeam';
import UpdateMemberScreen from './UpdateMember';
import { DeleteMemberModal, DeleteInvitationModal } from './Modals';

import { AnonymousModal } from '../shared/anonymousModal';

import configuration from '~/configuration';
import { useUserSession } from '~/core/hooks/use-user-session';

import { useFetchInvitedTeamMembers as useFetchInvitedMembers } from '~/lib/teams/hooks/use-fetch-invited-members';
import { useCurrentOrganization } from '~/lib/organizations/hooks/use-current-organization';
import { MembershipRole } from '~/lib/organizations/types/membership-role';
import roles from '~/lib/organizations/roles';

import { useInviteTeamMembers } from '~/lib/teams/hooks/use-invite-team-members';

import useActiveTeamMember from '~/lib/teams/hooks/use-active-member';
import useDeleteTeamMember from '~/lib/teams/hooks/use-delete-member';
import useDeactiveTeamMember from '~/lib/teams/hooks/use-deactive-member';
import {
  InvitesListProps,
  MembersListProps,
  TeamMembers,
  Teams,
} from '~/lib/teams/types/teams';

import useFetchTeamsById from '~/lib/server/teams/get-teams-id';
import useFetchUserById from '~/lib/server/user/get-current-user';
import SearchablePaginationController from '../shared/paginationController/search';
import LoadingMembersSpinner from '../organizations/LoadingMembersSpinner';
import Badge from '~/core/ui/Badge';
import UserImage from '../dashboard/UserImage';

import If from '~/core/ui/If';

import { dayPassed } from '../utils/daysCounter';
import DropdownOptions from '../shared/dropdownOptions';
import AnonymousWarning from '../shared/anonymousWarning';
import DeleteModal from '../shared/deleteModal';
import { useCurrentUserRole } from '~/lib/organizations/hooks/use-current-user-role';
import { useFetchTeams } from '~/lib/server/teams/get-teams';

import CancelContinueModal from '../shared/cancelContinueModal';
import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';
import { useFetchAcceptedInvitedMembers } from '~/lib/organizations/hooks/use-fetch-accepted-invites';
import { useGetOrganizationById } from '~/lib/organizations/hooks/use-get-organization-by-id';

const DEFAULT_ROWS = 10;

export default function TeamDetailsPage() {
  const router = useRouter();

  const { id } = router.query;

  const { t } = useTranslation('organization');

  const [anonymousModal, setAnonymousModal] = useState(false);
  const [addTeam, setAddTeams] = useState(false);
  const [updateMember, setUpdateMember] = useState(false);

  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS);

  const [memberFilter, setMemberFilter] = useState('');
  const auth = useAuth();
  const user = auth.currentUser;
  const userId = user?.uid as string;

  const organizationData = useCurrentOrganization();
  const organizationId = organizationData?.id as string;
  const { organization } = useGetOrganizationById(organizationId);

  const organizationName = organization?.name as string;

  const currentUserRole = useCurrentUserRole() as number;

  const [totalOrganizationTeams, setTotalOrganizationTeams] = useState(0);

  const {
    data,
    loading,
    refetch,
    totalMembers,
    currentPage,
    totalPages,
    sortData,
    search,
  } = useFetchTeamsById(organizationId, id, rowsPerPage, memberFilter);

  const { fetchOrganizationTeams } = useFetchTeams(
    organizationId,
    userId,
    rowsPerPage,
    '',
    '',
  );

  useEffect(() => {
    const getOrganizationTeams = async () => {
      const teams = await fetchOrganizationTeams();
      setTotalOrganizationTeams(teams as number);
    };
    getOrganizationTeams();
  }, [organizationId]);

  const [team, setTeams] = useState<Teams>();

  const [members, setMembers] = useState<TeamMembers[]>([]);
  const [selectedMember, setSelectedMember] = useState([]);

  useEffect(() => {
    if (data) {
      setTeams(data);
    }
  }, [data]);

  useEffect(() => {
    if (team) {
      setMembers(team?.users);
    }
  }, [team]);

  useEffect(() => {
    if (user?.isAnonymous) {
      setAnonymousModal(true);
    }
  }, [user]);

  useEffect(() => {
    if (memberFilter !== '') {
      search(currentPage, memberFilter);
    } else {
      refetch(currentPage);
    }
  }, [memberFilter]);

  const { totalInvitations } = useFetchAcceptedInvitedMembers(
    organization?.id as string,
  );

  const [organizationInvites, setOrganizationInvites] = useState(0);

  useEffect(() => {
    if (totalInvitations) setOrganizationInvites(totalInvitations);
  }, [totalInvitations]);

  return (
    <div className={'flex flex-col space-y-6 pb-36'}>
      {anonymousModal && (
        <Modal onClose={() => {}}>
          <AnonymousModal description="You are an anonymous user. Please sign up with an email to invite members" />
        </Modal>
      )}
      {user?.isAnonymous ? (
        <AnonymousWarning />
      ) : (
        <>
          {addTeam ? (
            <AddTeamScreen
              organizationId={organizationId}
              setAddTeams={setAddTeams}
            />
          ) : updateMember ? (
            <UpdateMemberScreen
              organization={organization}
              member={selectedMember}
              team={team}
              userId={userId}
            />
          ) : (
            <>
              {' '}
              <MembersList
                teams={team}
                members={members}
                refetch={refetch}
                sortData={sortData}
                loading={loading}
                setUpdateMember={setUpdateMember}
                setSelectedMember={setSelectedMember}
                setMemberFilter={setMemberFilter}
                organizationId={organizationId}
                userId={userId}
                organizationName={organizationName}
                currentUserRole={currentUserRole}
                totalPages={totalPages}
                currentPage={currentPage}
                rowsPerPage={rowsPerPage}
                memberFilter={memberFilter}
                search={search}
                setRowsPerPage={setRowsPerPage}
                isAnonymous={user?.isAnonymous as boolean}
                setAnonymousModal={setAnonymousModal}
                totalOrganizationTeams={totalOrganizationTeams}
                totalMembers={totalMembers}
              />
              <If condition={currentUserRole === MembershipRole.Admin}>
                <>
                  {' '}
                  <h1 className="font-medium text-xl">
                    {t('pendingInvitesHeading')}
                  </h1>
                  {team && (
                    <InvitesList
                      teams={team}
                      organizationId={organizationId}
                      isAnonymous={user?.isAnonymous as boolean}
                      setAnonymousModal={setAnonymousModal}
                    />
                  )}
                </>
              </If>
            </>
          )}
        </>
      )}
    </div>
  );
}

function MembersList({
  teams,
  members,
  setUpdateMember,
  setSelectedMember,
  setMemberFilter,
  loading,
  userId,
  organizationId,
  organizationName,
  refetch,
  sortData,
  currentUserRole,
  currentPage,
  totalPages,
  rowsPerPage,
  setRowsPerPage,
  memberFilter,
  search,
  isAnonymous,
  setAnonymousModal,
  totalOrganizationTeams,
  totalMembers,
}: MembersListProps) {
  const userData = useFetchUserById(userId);

  const [sorted, setSorted] = useState(false);
  const router = useRouter();

  const { id } = router.query;

  function handleEditScreen(member: MembersListProps) {
    setUpdateMember(true);
    setSelectedMember(member);
  }

  const Content = ({
    team,
    user,
    organizationId,
    organizationName,
    userData,
    userId,
    refetch,
  }: any) => {
    const auth = useAuth();
    const currentUser = auth.currentUser;

    const { trigger: deactiveMember } = useDeactiveTeamMember(
      organizationId,
      team.id,
      user.userId,
      user.name + ' ' + user.lastName,
      user.email,
      team.name,
      userData?.name + ' ' + userData?.lastName,
      organizationName,
      userId,
    );

    const { trigger: deleteMember } = useDeleteTeamMember(
      organizationId,
      team.id,
      user.userId,
      user.name + ' ' + user.lastName,
      user.email,
      team.name,
      userData?.name + ' ' + userData?.lastName,
      organizationName,
      userId,
    );

    const { trigger: activeMember } = useActiveTeamMember(
      organizationId,
      team.id,
      user.userId,
      user.name + ' ' + user.lastName,
      user.email,
      team.name,
      userData?.name + ' ' + userData?.lastName,
      organizationName,
      userId,
    );

    const { isMutating, trigger } = useRemoveMemberRequest(
      organizationId,
      user.userId,
    );

    const { t } = useTranslation('organization');

    const onUserRemoved = useCallback(() => {
      void (async () => {
        const promise = trigger().then(() => {
          refetch();
        });

        await toaster.promise(promise, {
          success: t(`removeMemberSuccessMessage`),
          error: t(`removeMemberErrorMessage`),
          loading: t(`removeMemberLoadingMessage`),
        });

        closeModalHandler();
      })();
    }, [trigger, t, refetch]);

    const [deactiveModal, setDeactiveModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [roleModal, setRolesModal] = useState(false);
    const [cantDeactivateModal, setCantDeactiveModal] = useState(false);
    const [deleteMemberMessage, setDeleteMemberMessage] = useState('');

    const [active, setActive] = useState(user.active);

    const closeModalHandler = () => {
      setDeactiveModal(false);
    };

    const closeRoleModalHandler = () => {
      setRolesModal(false);

      const dashboardElement = document.getElementById('team-details');
      if (dashboardElement) {
        dashboardElement.removeAttribute('class');
      }
    };

    // Signed in users
    const showModalHandler = () => {
      // If the organization has only 1 team
      if (totalOrganizationTeams === 1) {
        setCantDeactiveModal(true);
        setDeleteMemberMessage(`<p className="text-[#71717A]">
             This organization has only one team, by removing this user from the team. We are also going to remove them from the organization.
            </p>`);
      }
      // If the user has only 1 team
      else if (user.teams <= 1) {
        setCantDeactiveModal(true);
        setDeleteMemberMessage(`<p className="text-[#71717A]">
             This user has only one team, by removing this user from the team. We are also going to remove them from the organization.
            </p>`);
      } else {
        setDeleteMemberMessage(`<p className="text-[#71717A]">
              You&apos;re about to deactivate 
              <b>
                ${user.name} ${user.lastName}
              </b> 
              from <b>${team.name}</b> Members deactivated from a team
              can&apos;t access this team&apos;s dashboard anymore.
            </p>`);
      }
      setDeactiveModal(true);
    };

    // Anonymous users
    const showDeleteModalHandler = () => {
      // If the organization has only 1 team
      if (totalOrganizationTeams === 1) {
        setCantDeactiveModal(true);
        setDeleteMemberMessage(`<p className="text-[#71717A]">
           This organization has only one team, by removing this user from the team. We are also going to remove them from the organization.
          </p>`);
      }
      // If the user has only 1 team
      else if (user.teams <= 1) {
        setCantDeactiveModal(true);
        setDeleteMemberMessage(`<p className="text-[#71717A]">
           This user has only one team, by removing this user from the team. We are also going to remove them from the organization.
          </p>`);
      } else {
        setDeleteMemberMessage(`<p className="text-[#71717A]">
                You're about to remove${' '}
              <b>
                ${user.name} ${user.lastName}
              </b>${' '}
              from <b>${team.name}</b>. Members removed from a team can't
              access this team's dashboard anymore.
          </p>`);
      }
      setDeleteModal(true);
    };

    const closeDeleteModalHandler = () => {
      setDeleteModal(false);

      const dashboardElement = document.getElementById('team-details');
      if (dashboardElement) {
        dashboardElement.removeAttribute('class');
      }
    };

    const onActiveMember = useCallback(async () => {
      const promise = activeMember()
        .then((res: any) => {
          if (res.success === true) {
          } else {
            toaster.error(res.message);
          }
        })
        .catch((e: any) => {
          console.error('ERROR onActivatingMember', e);
          toaster.error(e.error);
        });

      await toaster.promise(promise, {
        loading: 'Activating member',
        success: 'Activated member',
        error: 'Error activating member',
      });
    }, [activeMember]);

    const onDeactivateMmeber = useCallback(async () => {
      const promise = deactiveMember()
        .then((res: any) => {
          if (res.success === true) {
            closeModalHandler();
          } else {
            toaster.error(res.message);
            closeModalHandler();
          }
        })
        .catch((e: any) => {
          console.error('ERROR onDeactivatingMember', e);
          toaster.error(e.error);
          closeModalHandler();
        });
      toast.promise(
        promise,
        {
          loading: 'Deactivating member',
          success: 'Member deactivated',
          error: 'Error on deactivating',
        },
        {
          style: {
            zIndex: 10000,
          },
        },
      );
    }, [deactiveMember, closeModalHandler]);

    const onDeleteMember = useCallback(async () => {
      const promise = deleteMember()
        .then((res: any) => {
          if (res.success === true) {
            closeDeleteModalHandler();
          } else {
            toaster.error(res.message);
            closeDeleteModalHandler();
          }
        })
        .catch((e: any) => {
          console.error('ERROR onDeletingMember', e);
          toaster.error(e.error);
          closeModalHandler();
        });
      toast.promise(
        promise,
        {
          loading: 'Removing member',
          success: 'Member removed',
          error: 'Error on removing member',
        },
        {
          style: {
            zIndex: 10000,
          },
        },
      );
    }, [closeDeleteModalHandler, deleteMember]);

    const [activateAction, setActiveAction] = useState() as any;

    useEffect(() => {
      let name, action, icon;
      if (
        currentUserRole === MembershipRole.Admin &&
        (user.role != MembershipRole.Admin ||
          (user.role === MembershipRole.Admin && team.admins > 1))
      ) {
        if (user.email && active === true) {
          name = 'Deactivate';
          action = () => showModalHandler();
          icon = deactivate;
        } else if (user.email && active === false) {
          name = 'Active';
          action = () => onActiveMember();
          icon = archiveRestore;
        } else {
          name = 'Delete';
          action = () => showDeleteModalHandler();
          icon = trash;
        }
        setActiveAction({
          name,
          action,
          icon,
        });
      } else {
        setActiveAction(null);
      }
    }, [currentUserRole, team, user, active]);

    const menuOptions = [
      {
        name: 'Edit',
        action: () => handleEditScreen(user),
        icon: edit,
      },
    ];
    if (activateAction) {
      menuOptions.unshift({
        name: activateAction.name,
        action: activateAction.action,
        icon: activateAction.icon,
      });
    }

    return (
      <>
        <tr
          key={team.name}
          className="hover:bg-zinc-50 border-b border-[#E4E4E7] text-xs"
        >
          <th className="w-auto px-4 py-2 flex space-x-4">
            <div className="flex space-x-2 items-center">
              {' '}
              <UserImage
                organizationId={organizationId}
                selectedMember={user.userId}
              />
              <div>
                <p className="text-sm font-normal text-left">
                  {user.name} {user.lastName}
                </p>
                {user.email != '' && (
                  <p className="text-xs font-medium text-left">{user.email}</p>
                )}
              </div>
            </div>
            {userId === user.userId && (
              <Badge size={'custom'}>
                <Trans i18nKey={'organization:youBadgeLabel'} />
              </Badge>
            )}
          </th>
          <th className="px-4 py-2 m-auto">
            {active === true ? (
              <p className="text-justify text-green-500 font-normal px-2.5 py-0.5 ">
                Active
              </p>
            ) : (
              <p className="text-left text-red-500 font-normal px-2.5 py-0.5 ">
                Not active
              </p>
            )}
          </th>
          <th className="relative w-auto px-4 py-2">
            {(currentUser?.uid === user.userId ||
              currentUserRole > MembershipRole.Member) && (
              <DropdownOptions options={menuOptions} />
            )}
          </th>
        </tr>
        {/* SIGNED IN USERS*/}
        <DeleteModal
          title={
            cantDeactivateModal
              ? 'Remove From Organization?'
              : 'Deactivate From Team?'
          }
          message={deleteMemberMessage}
          confirmMessage={cantDeactivateModal ? 'Remove' : 'Deactivate'}
          cancelMessage="Cancel"
          showModal={deactiveModal}
          setShowModal={() => {
            setDeactiveModal(true);
          }}
          confirmAction={
            cantDeactivateModal ? onUserRemoved : onDeactivateMmeber
          }
          cancelAction={closeModalHandler}
          typeMessage="html"
        />

        {/* ANONYMOUS USERS*/}
        <DeleteModal
          title={
            cantDeactivateModal
              ? 'Remove From Organization?'
              : 'Deactivate From Team?'
          }
          message={deleteMemberMessage}
          confirmMessage={'Remove'}
          cancelMessage="Cancel"
          showModal={deleteModal}
          setShowModal={() => {
            setDeleteModal(true);
          }}
          confirmAction={cantDeactivateModal ? onUserRemoved : onDeleteMember}
          cancelAction={closeDeleteModalHandler}
          typeMessage="html"
        />

        {roleModal && (
          <Modal onClose={closeRoleModalHandler}>
            <RoleModal closeModalHandler={closeRoleModalHandler} />
          </Modal>
        )}
      </>
    );
  };

  const inviteMembersHandler = () => {
    if (!isAnonymous) {
      router.push(`/settings/teams/${id}/invite`);
    } else {
      setAnonymousModal(true);
    }
  };

  return (
    <>
      <div className="flex space-x-2 justify-between">
        {!loading ? (
          <h1 className="font-medium text-xl">{teams?.name}</h1>
        ) : (
          <LoadingMembersSpinner />
        )}
        <div></div>
        <Link
          href={`/settings/teams`}
          className="flex bg-[#F4F4F5] px-4 py-2 space-x-2 rounded-md hover:bg-gray-50"
        >
          <Image className="my-auto" src={arrowLeft} alt="arrowLeft"></Image>
          <p className="text-sm">Back to teams</p>
        </Link>
      </div>

      <div className="md:flex space-y-2 md:space-y-2 justify-between">
        <div className="md:flex space-x-0 space-y-2 md:space-x-2 md:space-y-0">
          <input
            onChange={(e) => setMemberFilter(e.target.value)}
            className="border rounded-md py-1 px-3 text-sm text-[#71717A]"
            placeholder="Filter by Member Name"
          ></input>
          <If condition={currentUserRole > 0}>
            <button
              onClick={inviteMembersHandler}
              className="flex bg-[#F4F4F5] px-4 py-2 space-x-2 rounded-md hover:bg-gray-50"
            >
              <Image className="my-auto" src={add} alt="plus"></Image>
              <p className="text-sm">Invite Members</p>
            </button>
          </If>
        </div>
        <div className="flex space-x-2">
          <Image className="w-4" src={users} alt="teams"></Image>
          <p className="my-auto font-medium text-sm">{totalMembers} Members</p>
        </div>
      </div>
      <>
        {!loading ? (
          <div
            style={{ width: '-webkit-fill-available' }}
            className="w-auto m-auto md:m-0 md:w-fit border border-[#E4E4E7] rounded-md overflow-x-auto"
          >
            <table className="w-full">
              <thead className="border border-b text-left">
                <tr>
                  <th className="items-center flex px-3 py-2 space-x-2">
                    <p className="font-medium text-xs text-[#71717A]">
                      Member Email
                    </p>
                    <button
                      disabled={members && members?.length > 1 ? false : true}
                      onClick={() => {
                        setSorted(!sorted);
                        if (!sorted) sortData(currentPage, 'ascending');
                        else sortData(currentPage, 'descending');
                      }}
                    >
                      <Image
                        src={ChevronDownIcon}
                        alt="ChevronDownIcon"
                        className="h-4"
                      />
                    </button>
                  </th>
                  <th className="px-3 py-2">
                    <p className="font-medium text-sm text-[#71717A]">Status</p>
                  </th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              {teams && (
                <tbody className="">
                  {members?.map((user: any, index: number) => (
                    <Content
                      key={index}
                      team={teams}
                      user={user}
                      organizationId={organizationId}
                      setUpdateMember={setUpdateMember}
                      organizationName={organizationName}
                      userData={userData}
                      userId={userId}
                      refetch={refetch}
                    />
                  ))}
                </tbody>
              )}
            </table>
          </div>
        ) : (
          <div className="m-auto">
            <LoadingMembersSpinner />
          </div>
        )}
        <SearchablePaginationController
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          totalPages={totalPages}
          currentPage={currentPage}
          refetch={sorted ? sortData : refetch}
          search={search}
          text={memberFilter}
        />
      </>
    </>
  );
}

function InvitesList({
  teams,
  organizationId,
  isAnonymous,
  setAnonymousModal,
}: InvitesListProps) {
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS);
  const [inviteFilter, setInviteFilter] = useState('');

  const {
    data: members,
    refetch,
    totalInvitations,
    currentPage,
    totalPages,
    sortData,
    search,
    loading,
  } = useFetchInvitedMembers(
    organizationId,
    teams?.id,
    rowsPerPage,
    inviteFilter,
  );

  const [sorted, setSorted] = useState(false);

  const router = useRouter();

  const { id } = router.query;

  useEffect(() => {
    if (members) setInvitations(members);
  }, [members]);

  const [invitations, setInvitations] = useState<any>();

  useEffect(() => {
    if (inviteFilter !== '') {
      search(currentPage, inviteFilter);
    } else {
      refetch(currentPage);
    }
  }, [inviteFilter]);

  function getSelectedRoleModel(currentRole: MembershipRole | undefined) {
    const role = roles.find((role) => {
      return role.value === currentRole;
    });

    return role?.label;
  }

  const Content = ({ invitation, organizationId }: any) => {
    const [deactiveModal, setDeactiveModal] = useState(false);

    const { trigger } = useInviteTeamMembers(
      organizationId,
      invitation.team.id,
    );
    const { t } = useTranslation('organization');

    const user = useUserSession();
    const facilitator = user?.data?.name + ' ' + user?.data?.lastName;

    const onResend = useCallback(async () => {
      const body = [
        {
          email: invitation.email,
          facilitator: facilitator,
        },
      ];

      const promise = trigger(body).then(() => setStatus(false));

      await toast.promise(promise, {
        success: 'Invitation resent',
        error: t(`inviteMembersError`),
        loading: `Resending invitation`,
      });
    }, [trigger, t, invitation, facilitator]);

    const showModalHandler = () => {
      setDeactiveModal(true);
    };

    const closeModalHandler = () => {
      setDeactiveModal(false);

      const dashboardElement = document.getElementById('team-details');
      if (dashboardElement) {
        dashboardElement.removeAttribute('class');
      }
    };

    const isExpired = (timestamp: { seconds: number; nanoseconds: number }) => {
      const timestampDate = new Date(
        timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000,
      );
      const currentDate = new Date();

      const timeDifference = currentDate.getTime() - timestampDate.getTime();

      const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

      if (days > 0) {
        return true;
      }

      return false;
    };

    function assertSiteUrl(siteUrl: Maybe<string>): asserts siteUrl is string {
      if (!siteUrl && configuration.production) {
        throw new Error(
          `Please configure the "siteUrl" property in the configuration file ~/configuration.ts`,
        );
      }
    }

    function getInvitePageFullUrl() {
      let siteUrl = configuration.site.siteUrl;

      assertSiteUrl(siteUrl);

      const url = [siteUrl, 'auth', 'invite', 'team', invitation.code].join(
        '/',
      );

      navigator.clipboard
        .writeText(url)
        .then(() => {
          toaster.success('Copied to clipboard');
        })
        .catch((error) => {
          console.error('Error on getInvitePageFullUrl' + error);
          toaster.error('Something went wrong');
        });
    }

    const [status, setStatus] = useState(isExpired(invitation.created));

    const menuOptions = [
      {
        name: 'Resend',
        action: onResend,
        icon: send,
      },
      {
        name: 'Delete',
        action: showModalHandler,
        icon: trash,
      },
      { name: 'Copy Invite URL', action: getInvitePageFullUrl, icon: copy },
    ];

    return (
      <>
        <tr
          key={invitation.id}
          className="hover:bg-zinc-50 border-b border-[#E4E4E7] text-xs"
        >
          <th className="w-auto px-4 ">
            <p className="text-sm font-normal text-left">{invitation.email}</p>
          </th>
          <th className="w-auto px-4 ">
            <p className="text-sm font-normal text-left">
              {dayPassed(invitation.created)} days ago
            </p>
          </th>
          <th className="w-auto px-4 ">
            {status ? (
              <p className="text-sm font-normal text-left text-red-500">
                Expired
              </p>
            ) : (
              <p className="text-sm font-normal text-left">Pending</p>
            )}
          </th>
          <th className="relative w-auto px-4 ">
            <DropdownOptions options={menuOptions} />
          </th>
        </tr>

        {deactiveModal && (
          <Modal onClose={closeModalHandler}>
            <DeleteInvitationModal
              invitation={invitation}
              organizationId={organizationId}
              closeModalHandler={closeModalHandler}
            />
          </Modal>
        )}
      </>
    );
  };

  const inviteMembersHandler = () => {
    if (!isAnonymous) {
      router.push(`/settings/teams/${id}/invite`);
    } else {
      setAnonymousModal(true);
    }
  };

  return (
    <>
      <div className="md:flex space-y-2 md:space-y-2 justify-between">
        <div className="md:flex space-x-0 space-y-2 md:space-x-2 md:space-y-0">
          <input
            onChange={(e) => setInviteFilter(e.target.value)}
            className="border rounded-md py-1 px-3 text-sm text-[#71717A]"
            placeholder="Filter Members"
          ></input>
          <button
            onClick={inviteMembersHandler}
            className="flex bg-[#F4F4F5] px-4 py-2 space-x-2 rounded-md hover:bg-gray-50"
          >
            <Image className="my-auto" src={add} alt="plus"></Image>
            <p className="text-sm">Invite Members</p>
          </button>
        </div>
        <div className="flex space-x-2">
          <Image className="w-4" src={users} alt="teams"></Image>
          <p className="my-auto font-medium text-sm">
            {totalInvitations} Members
          </p>
        </div>
      </div>
      <>
        {!loading ? (
          <div
            style={{ width: 'auto' }}
            className="relative overflow-auto lg:overflow-visible border border-[#E4E4E7] rounded-md"
          >
            {invitations?.length > 0 ? (
              <table className="w-full table-auto">
                <thead className="border border-b text-left">
                  <tr>
                    <th className="items-center flex px-3 py-2 space-x-2">
                      <p className="font-medium text-xs text-[#71717A]">
                        Member Email
                      </p>
                      <button
                        disabled={members && members?.length > 1 ? false : true}
                        onClick={() => {
                          setSorted(!sorted);
                          if (!sorted) sortData(currentPage, 'ascending');
                          else sortData(currentPage, 'descending');
                        }}
                      >
                        <Image
                          src={ChevronDownIcon}
                          alt="ChevronDownIcon"
                          className="h-4"
                        />
                      </button>
                    </th>
                    <th className="px-3 py-2">
                      {' '}
                      <p className="font-medium text-sm text-[#71717A]">Sent</p>
                    </th>
                    <th className="px-3 py-2">
                      {' '}
                      <p className="font-medium text-sm text-[#71717A]">
                        Status
                      </p>
                    </th>
                  </tr>
                </thead>
                <tbody className="overflow-scroll">
                  {invitations?.length > 0 &&
                    invitations?.map((invitation: any, index: number) => (
                      <Content
                        key={index}
                        invitation={invitation}
                        organizationId={organizationId}
                      />
                    ))}
                </tbody>
              </table>
            ) : (
              <div className="w-full border border-[#E4E4E7] rounded-md">
                <p className="py-16 text-center">No invitations</p>
              </div>
            )}
          </div>
        ) : (
          <div className="m-auto">
            <LoadingMembersSpinner />
          </div>
        )}
        <SearchablePaginationController
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          totalPages={totalPages}
          currentPage={currentPage}
          refetch={sorted ? sortData : refetch}
          search={search}
          text={inviteFilter}
        />
      </>
    </>
  );
}

function RoleModal({ closeModalHandler }: any) {
  return (
    <div className="absolute">
      <div className="min-h-screen flex items-center justify-center">
        <div className="fixed inset-0"></div>

        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg md:w-2/6 mx-6 md:mx-0">
            <div className="flex justify-between items-center mb-1.5">
              <h2 className="text-lg font-semibold">Update Member Settings</h2>
              <button onClick={(e) => closeModalHandler()}>
                <Image src={x} alt="x" />
              </button>
            </div>
            <p className="text-[#71717A]">
              A CHANGE TO YOUR ACCOUNT WILL NOT AFFECT PAYMENT, YOU WILL NEED TO
              MAKE CHANGES TO PAYMENT INFORMATION IF YOU DO NOT WANT TO GET
              CHARGED
            </p>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={closeModalHandler}
                className="px-4 py-2 bg-white border text-black rounded hover:bg-zinc-100 focus:outline-none"
              >
                Ok
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function useRemoveMemberRequest(organizationId: string, targetMember: string) {
  const fetcher = useApiRequest();
  const endpoint = `/api/organizations/${organizationId}/members/${targetMember}`;

  return useSWRMutation(endpoint, (path) => {
    return fetcher({
      path,
      method: 'DELETE',
    });
  });
}
