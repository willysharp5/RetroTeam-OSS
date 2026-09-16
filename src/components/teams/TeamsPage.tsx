import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from 'reactfire';
import { Trans } from 'react-i18next';

import trash from 'public/assets/svg/trash.svg';
import edit from 'public/assets/svg/edit-3.svg';
import plus from '/public/assets/svg/plus-circled-black.svg';
import menu from '/public/assets/svg/3-dots.svg';
import users from 'public/assets/svg/users.svg';
import ChevronDownIcon from 'public/assets/svg/caret-sort.svg';
import eye from 'public/assets/svg/eye-open.svg';

import Image from 'next/image';
import { useRouter } from 'next/router';

import { useCurrentOrganization } from '~/lib/organizations/hooks/use-current-organization';
import { MembershipRole } from '~/lib/organizations/types/membership-role';
import roles from '~/lib/organizations/roles';

import AddTeamScreen from './AddTeam';
import UpdateTeamScreen from './UpdateTeam';
import { DeleteModal } from './Modals';
import Modal from '../shared/modal';
import SearchablePaginationController from '../shared/paginationController/search';

import LoadingMembersSpinner from '../organizations/LoadingMembersSpinner';

import { Teams, TeamsListProps, Content } from '~/lib/teams/types/teams';

import { useFetchTeams } from '~/lib/server/teams/get-teams';
import If from '~/core/ui/If';
import AnonymousWarning from '../shared/anonymousWarning';
import { useCurrentUserRole } from '~/lib/organizations/hooks/use-current-user-role';
import MembersWarning from '../shared/MembersWarning';

const DEFAULT_ROWS = 10;

export default function TeamsPage() {
  const [addTeam, setAddTeams] = useState(false);
  const [updateTeam, setUpdateTeams] = useState(false);

  const [deleteModal, setDeleteModal] = useState(false);

  const closeDeleteModalHandler = () => {
    setDeleteModal(false);

    const dashboardElement = document.getElementById('teams');
    if (dashboardElement) {
      dashboardElement.removeAttribute('class');
    }
  };

  const showModalHandler = () => {
    setDeleteModal(true);

    const dashboardElement = document.getElementById('teams');

    if (dashboardElement) {
      dashboardElement.setAttribute('class', 'fixed w-full h-screen z-30');
      dashboardElement.style.backdropFilter = 'blur(2px)';
    }
  };

  const auth = useAuth();
  const user = auth.currentUser;
  const userId = user?.uid as string;

  const organization = useCurrentOrganization();
  const organizationId = organization?.id as string;
  const organizationName = organization?.name as string;

  const role = useCurrentUserRole();

  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS);
  const [teamFilter, setTeamFilter] = useState('');
  const [sorted, setSorted] = useState('');

  const {
    data,
    refetch,
    totalTeams,
    totalPages,
    currentPage,
    loading,
    sortData,
    search,
  } = useFetchTeams(organizationId, userId, rowsPerPage, teamFilter, sorted);

  const [selectedTeam, setSelectedTeam] = useState([]);

  const createTeamHandler = () => {
    if (!user?.isAnonymous) {
      setAddTeams(true);
    }
  };

  if (user?.isAnonymous) {
    return (
      <>
        <AnonymousWarning />
      </>
    );
  }

  if (role === MembershipRole.Member) {
    return <MembersWarning organizationId={organizationId} />;
  }

  return (
    <div className={'flex flex-col space-y-6 pb-36'}>
      {deleteModal && (
        <Modal onClose={closeDeleteModalHandler}>
          <DeleteModal
            organizationId={organizationId}
            team={selectedTeam}
            closeModalHandler={closeDeleteModalHandler}
          />
        </Modal>
      )}
      {addTeam ? (
        <AddTeamScreen
          organizationId={organizationId}
          setAddTeams={setAddTeams}
        />
      ) : updateTeam ? (
        <UpdateTeamScreen
          organizationId={organizationId}
          organizationName={organizationName}
          setUpdateTeams={setUpdateTeams}
          team={selectedTeam}
          showModalHandler={showModalHandler}
          totalTeams={totalTeams}
        />
      ) : (
        <TeamsList
          organizationId={organizationId}
          createTeamHandler={createTeamHandler}
          data={data}
          setUpdateTeams={setUpdateTeams}
          setSelectedTeam={setSelectedTeam}
          refetch={refetch}
          loading={loading}
          totalTeams={totalTeams}
          totalPages={totalPages}
          currentPage={currentPage}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          sortData={sortData}
          search={search}
          teamFilter={teamFilter}
          setTeamFilter={setTeamFilter}
          sorted={sorted}
          setSorted={setSorted}
          showModalHandler={showModalHandler}
          deleteModal={deleteModal}
          isAnonymous={user?.isAnonymous as boolean}
        />
      )}
    </div>
  );
}

function TeamsList({
  createTeamHandler,
  data,
  setUpdateTeams,
  setSelectedTeam,
  organizationId,
  refetch,
  loading,
  totalTeams,
  totalPages,
  currentPage,
  rowsPerPage,
  setRowsPerPage,
  sortData,
  search,
  teamFilter,
  setTeamFilter,
  sorted,
  setSorted,
  showModalHandler,
  isAnonymous,
}: TeamsListProps) {
  function handleEditScreen(team: Teams) {
    setUpdateTeams(true);
    setSelectedTeam(team);
  }

  function getSelectedRoleModel(currentRole: MembershipRole | undefined) {
    const role = roles.find((role) => {
      return role.value === currentRole;
    });

    return role?.label;
  }

  const Content = ({ team, organizationId }: Content) => {
    const [showMenu, setShowMenu] = useState(false);

    const menuRef = useRef<HTMLDivElement>(null);

    const router = useRouter();

    const currentUserRole = useCurrentUserRole() as number;

    const handleClickOutside = (event: any) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    useEffect(() => {
      document.addEventListener('mousedown', handleClickOutside);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    const navigateToDetailsPage = useCallback(
      (id: string) => {
        void router.push(`/settings/teams/${id}`);
      },
      [router],
    );

    const canDeleteTeam =
      totalTeams > 1 && currentUserRole === MembershipRole.Admin;

    return (
      <>
        {
          <tr
            key={team.name}
            className="hover:bg-zinc-50 border-b border-[#E4E4E7] text-xs"
          >
            <th className="w-auto px-4 py-2">
              <p
                onClick={(e) => {
                  navigateToDetailsPage(team.id);
                }}
                className="cursor-pointer text-sm font-normal text-left"
              >
                {team.name}
              </p>
            </th>

            <th className="px-4 py-2 m-auto">
              <div
                className="w-[45%] flex items-center justify-between"
                key={team.user.userId}
              >
                <p className="border px-2.5 py-0.5 rounded-md">
                  <Trans i18nKey={getSelectedRoleModel(currentUserRole)} />
                </p>
                <p className="ml-2 text-sm font-normal">
                  {team.user.name} {team.user.lastName}
                </p>
              </div>
            </th>
            <th className="w-auto px-4 py-2">
              <button
                onClick={(e) => {
                  navigateToDetailsPage(team.id);
                }}
                className="cursor-pointer m-auto w-12 px-4 py-2 bg-[#F4F4F5] underline rounded-md text-sm"
              >
                {team.members}
              </button>
            </th>
            <th className="relative w-auto px-4 py-2">
              <button
                className="flex  w-h w-6"
                onClick={() => setShowMenu(!showMenu)}
              >
                <Image className="ml-auto" src={menu} alt="menu vector" />
              </button>
              {showMenu && (
                <div
                  ref={menuRef}
                  className="absolute space-y-2 rounded-md p-1 w-max top-10 left-0 z-10 bg-white border shadow-md"
                >
                  {currentUserRole === MembershipRole.Admin && (
                    <button
                      onClick={() => handleEditScreen(team)}
                      className="flex space-x-2 px-2"
                    >
                      <Image src={edit} alt="edit"></Image>
                      <p className="text-sm font-normal">Edit</p>
                    </button>
                  )}
                  {canDeleteTeam && (
                    <button
                      onClick={() => {
                        setSelectedTeam(team);
                        showModalHandler();
                      }}
                      className="flex space-x-2 px-2"
                    >
                      <Image src={trash} alt="delete"></Image>
                      <p className="text-sm font-normal">Delete</p>
                    </button>
                  )}
                  <button
                    onClick={() => navigateToDetailsPage(team.id)}
                    className="flex space-x-2 px-2"
                  >
                    <Image src={eye} alt="eye"></Image>
                    <p className="text-sm font-normal">View</p>
                  </button>
                </div>
              )}
            </th>
          </tr>
        }
      </>
    );
  };

  useEffect(() => {
    if (data) {
      if (teamFilter !== '') {
        search(currentPage, teamFilter);
      } else {
        refetch(currentPage);
      }
    }
  }, [teamFilter]);

  return (
    <>
      <div className="md:flex space-y-2 md:space-y-2 justify-between">
        <div className="md:flex space-x-0 space-y-2 md:space-x-2 md:space-y-0">
          <input
            onChange={(e) => setTeamFilter(e.target.value)}
            className="border rounded-md py-1 px-3 text-sm text-[#71717A]"
            placeholder="Filter teams"
          ></input>
          <If condition={!isAnonymous}>
            <button
              disabled={loading}
              onClick={createTeamHandler}
              className="flex bg-[#F4F4F5] disabled:bg-gray-50 disabled:text-gray-500 px-4 py-2 space-x-2 rounded-md hover:bg-gray-50"
            >
              <Image className="my-auto" src={plus} alt="plus"></Image>
              <p className="text-sm">Create new team</p>
            </button>
          </If>
        </div>
        <div className="flex space-x-2">
          <Image className="w-4" src={users} alt="teams"></Image>
          <p className="my-auto font-medium text-sm">{totalTeams} Teams</p>
        </div>
      </div>
      {!loading ? (
        <>
          {data && data?.length > 0 && (
            <>
              <div
                style={{ width: 'auto' }}
                className="relative overflow-auto lg:overflow-visible border border-[#E4E4E7] rounded-md"
              >
                <table className="w-full">
                  <thead className="border border-b text-left">
                    <tr>
                      <th className="items-center flex px-3 py-2 space-x-2">
                        <p className="font-medium text-xs text-[#71717A]">
                          Teams
                        </p>
                        <button
                          disabled={data && data?.length > 1 ? false : true}
                          onClick={() => {
                            if (sorted === '' || sorted === 'descending') {
                              setSorted('ascending');
                              sortData(
                                currentPage,
                                'ascending',
                                data[data.length - 1].name,
                              );
                            } else {
                              setSorted('descending');
                              sortData(
                                currentPage,
                                'descending',
                                data[data.length - 1].name,
                              );
                            }
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
                        <p className="font-medium text-sm text-[#71717A]">
                          Role
                        </p>
                      </th>
                      <th className="px-3 py-2">
                        <p className="font-medium text-sm text-[#71717A]">
                          Members
                        </p>
                      </th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="">
                    {data.map((team: any, index: number) => (
                      <Content
                        key={index}
                        team={team}
                        organizationId={organizationId}
                        setUpdateTeams={setUpdateTeams}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              <SearchablePaginationController
                rowsPerPage={rowsPerPage}
                setRowsPerPage={setRowsPerPage}
                totalPages={totalPages}
                currentPage={currentPage}
                refetch={sorted === 'ascending' ? sortData : refetch}
                search={search}
                lastId={data[data.length - 1].name}
                sort={sorted}
                text={teamFilter}
              />
            </>
          )}
        </>
      ) : (
        <div className="m-auto">
          <LoadingMembersSpinner />
        </div>
      )}
    </>
  );
}
