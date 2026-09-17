import { useState, useEffect, Fragment, useRef } from 'react';
import { useAuth } from 'reactfire';
import { Toaster } from 'react-hot-toast';

import Image from 'next/image';

import stopWatch from '/public/assets/svg/stopwatch.svg';
import toDo from '/public/assets/svg/list-bullet.svg';
import done from '/public/assets/svg/check-circled.svg';
import edit from 'public/assets/svg/edit-3.svg';

import SectionHeader from '../shared/sectionheader';
import PaginationController from '../shared/paginationController';
import TopMenuTabs from '../retrospectives/TopMenuBar';

import { useCurrentOrganization } from '~/lib/organizations/hooks/use-current-organization';
import { Actions } from '~/lib/actions/types/actions';
import { useCurrentTeam } from '~/lib/organizations/hooks/use-current-team';
import useFetchPaginatedActions from '~/lib/server/actions/get-paginated-actions';
import { useGetRetrospectives } from '~/lib/retrospectives/hooks/use-get-retrospectives';
import { useDeleteRetrospective } from '~/lib/retrospectives/hooks/use-delete-retrospective-by-id';
import { usePatchRetrospective } from '~/lib/retrospectives/hooks/use-patch-retrospective-by-id';

import UserImage from './UserImage';
import { RetrospectivesCards } from '../retrospectives/RetrospectivesCards';
import EditActionSidebarComponent from '../actions/EditActionSidebar';
import LoadingMembersSpinner from '../organizations/LoadingMembersSpinner';

import { Retrospectives } from '~/lib/retrospectives/types/retrospectives';
import { showDateHtml } from '../utils/dateformatter';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/core/ui/Tooltip';
import If from '~/core/ui/If';
import useFetchRules from '~/lib/server/rules/get-rules';

import { useFetchOrganizationTeamMembersMetadata } from '~/lib/organizations/hooks/use-fetch-team-members-metadata';

import { useFetchBoardMembersMetadata } from '~/lib/board/hooks/use-fetch-board-members-metadata';
import SearchableDropdown from '../shared/searchableDropdown/searchableDropdown';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useSearchMyRetrospectives } from '~/lib/retrospectives/hooks/use-search-my-retrospectives';

import { useFetchTeams } from '~/lib/server/teams/get-teams';
import { boardPermissions } from '../utils/boardPermissions';
import { TeamMembers } from '~/lib/teams/types/teams';

const DEFAULT_ROWS = 4;

interface LatestActionsProps {
  actions: Actions[] | any[] | null;
  organizationId: string;
  teamId: string;
  refetch: (page: number) => void;
  rowsPerPage: number;
  setRowsPerPage: (rows: number) => void;
  currentPage: number;
  totalPages: number;
  totalActions: number;
  filterMember: string;
  setFilterMember: (member: string) => void;
  showSidebar: boolean;
  setShowSidebar: (show: boolean) => void;
  loading: boolean;
  userId: string;
  selectedTab: number;
  retrospectiveId: string;
  loadingBoards: boolean;
  retrospectives: any;
  selectedBoard: any;
  setSelectedBoard: (board: any) => void;
  isAnonymous: boolean;
  userEmail: any;
}
export default function DashboardDemo() {
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS);

  const router = useRouter();

  const { myActions } = router.query;

  const [loadingRetrospectives, setLoadingRetrospectives] = useState(true);

  const organization = useCurrentOrganization();
  const organizationId = organization?.id as string;

  const { team } = useCurrentTeam();
  const teamId = team?.id as string;

  const auth = useAuth();
  const user = auth.currentUser;
  const userId = user?.uid as string;

  const [selectedMember, setFilterMember] = useState('Any member');

  const [showSidebar, setShowSidebar] = useState(false);

  const [selectedTab, setSelectedTab] = useState(2);

  const [selectedBoard, setSelectedBoard] = useState<any>();

  const { retrospectives, loading: loadingBoards } = useGetRetrospectives(
    organizationId,
    teamId,
    rowsPerPage,
    'mine',
  );
  const scrollToActions = () => {
    const actionsElement = document.getElementById('actions');
    if (actionsElement) {
      actionsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    if (myActions && userId) {
      setFilterMember(userId);
    }
  }, [myActions, userId]);

  useEffect(() => {
    if (myActions && !loadingRetrospectives) {
      scrollToActions();
    }
  }, [loadingRetrospectives, myActions]);

  useEffect(() => {
    if (myActions) {
      setSelectedTab(1);
    } else {
      if (!loadingBoards) {
        if (retrospectives.length === 0) {
          setSelectedTab(1);
        }
      }
    }
  }, [loadingBoards, retrospectives, myActions]);

  const { data, loading, refetch, currentPage, totalActions, totalPages } =
    useFetchPaginatedActions(
      organizationId,
      selectedMember,
      teamId,
      rowsPerPage,
      selectedTab,
      selectedBoard?.id,
    );

  return (
    <>
      {showSidebar && (
        <div className="fixed top-0 left-0 w-full h-full bg-black opacity-20 z-10 pointer-events-auto "></div>
      )}
      <div className={'flex flex-col space-y-6 pb-36'}>
        <Toaster />
        <div className="my-6 space-y-6">
          <LatestBoards
            user={user}
            setLoadingRetrospectives={setLoadingRetrospectives}
          />

          <div className="flex text-sm justify-between px-8 tv:px-36 ">
            <div className="md:flex overflow-x-hidden flex-wrap  text-zinc-400 bg-zinc-100 rounded-lg px-1.5 py-2 h-fit">
              <div
                className={`py-1 px-3 rounded-sm ${
                  selectedTab === 1 ? 'bg-white text-zinc-600' : ''
                } hover:bg-zinc-50 hover:text-zinc-500 transition cursor-pointer`}
                onClick={() => setSelectedTab(1)}
              >
                <p>Organization Action Items</p>
              </div>
              <div
                className={`py-1 px-3 rounded-sm ${
                  selectedTab === 2 ? 'bg-white text-zinc-600' : ''
                } hover:bg-zinc-50 hover:text-zinc-500 transition cursor-pointer`}
                onClick={() => setSelectedTab(2)}
              >
                <p>Board Action Items</p>
              </div>
            </div>
          </div>

          <LatestActions
            actions={data}
            organizationId={organizationId}
            teamId={teamId}
            refetch={refetch}
            rowsPerPage={rowsPerPage}
            currentPage={currentPage}
            setRowsPerPage={setRowsPerPage}
            totalPages={totalPages}
            totalActions={totalActions}
            setFilterMember={setFilterMember}
            filterMember={selectedMember}
            showSidebar={showSidebar}
            setShowSidebar={setShowSidebar}
            loading={loading}
            userId={userId}
            selectedTab={selectedTab}
            retrospectiveId={selectedBoard?.id}
            loadingBoards={loadingBoards}
            retrospectives={retrospectives}
            selectedBoard={selectedBoard}
            setSelectedBoard={setSelectedBoard}
            isAnonymous={user?.isAnonymous as boolean}
            userEmail={user?.email}
          />
        </div>
      </div>
    </>
  );
}

function LatestBoards({ user, setLoadingRetrospectives }: any) {
  const organization = useCurrentOrganization();
  const organizationId = organization?.id as string;

  const { team } = useCurrentTeam();
  const teamId = team?.id as string;

  const { totalTeams } = useFetchTeams(organizationId, user?.uid, 2, '', '');

  const [rowsPerPage] = useState(DEFAULT_ROWS);

  const {
    retrospectives,
    fetchRetrospectives,
    currentPage,
    totalPages,
    totalRetrospectives,
    totalCreatedRetrospectives,
    filters,
    setFilters,
    loading,
  } = useGetRetrospectives(organizationId, teamId, rowsPerPage);

  const { deleteRetrospective } = useDeleteRetrospective(organizationId);

  const { patchRetrospective } = usePatchRetrospective(organizationId);

  const { data: rules } = useFetchRules('retrospectives');

  function onDeleteRetrospective(id: string) {
    deleteRetrospective(id);
    fetchRetrospectives(1);
  }

  function onPatchRetrospective(data: Partial<Retrospectives>) {
    patchRetrospective(data);
    fetchRetrospectives(1);
  }

  useEffect(() => {
    setLoadingRetrospectives(loading);
  }, [loading]);

  return (
    <div className="space-y-6">
      <TopMenuTabs filters={filters} setFilters={setFilters} />
      <div className="bg-gray-100 p-2 space-y-6 px-8 tv:px-36 ">
        <SectionHeader
          description={
            'All retrospectives you participated in for your organization.'
          }
          redirectTo={'/search/retrospectives'}
        >
          {filters.archived
            ? `${organization?.name} - Archives`
            : filters.ownBoards
            ? 'My Boards'
            : filters.sharedBoards
            ? 'Shared Boards'
            : filters.teamBoards
            ? `${team?.name ? team.name + ' - ' : ''}  Team Boards`
            : `${organization?.name} - Organization Boards`}{' '}
          ({totalRetrospectives})
        </SectionHeader>
        {loading ? (
          <div className="flex items-center justify-center h-[100px]">
            <LoadingMembersSpinner />
          </div>
        ) : (
          <Fragment>
            {!user?.isAnonymous ? (
              <RetrospectivesCards
                retrospectives={retrospectives}
                fetchRetrospectives={fetchRetrospectives}
                deleteRetrospective={onDeleteRetrospective}
                patchRetrospective={onPatchRetrospective}
                currentPage={currentPage}
                totalPages={totalPages}
                rowsPerPage={4}
                hidePaginationController
                rules={rules}
                userId={user?.uid}
                isAnonymous={user?.isAnonymous}
                totalTeams={totalTeams}
              />
            ) : (
              <Fragment>
                {filters.ownBoards || filters.sharedBoards ? (
                  <RetrospectivesCards
                    retrospectives={retrospectives}
                    fetchRetrospectives={fetchRetrospectives}
                    deleteRetrospective={onDeleteRetrospective}
                    patchRetrospective={onPatchRetrospective}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    rowsPerPage={4}
                    hidePaginationController
                    rules={rules}
                    userId={user?.uid}
                    isAnonymous={user?.isAnonymous}
                    totalTeams={totalTeams}
                  />
                ) : (
                  <Fragment>
                    <p>
                      As an anonymous user, you cannot view these{' '}
                      {filters.archived
                        ? `Archives`
                        : filters.ownBoards
                        ? 'My Boards'
                        : filters.sharedBoards
                        ? 'Shared Boards'
                        : filters.teamBoards
                        ? 'Team Boards'
                        : `Organization Boards`}{' '}
                    </p>
                    <button className="bg-black hover:bg-zinc-700 text-white py-2 px-4 rounded-md">
                      <Link href={'/auth/sign-in'}>
                        Sign in to view this{' '}
                        {filters.archived
                          ? `Archives`
                          : filters.ownBoards
                          ? 'My Boards'
                          : filters.sharedBoards
                          ? 'Shared Boards'
                          : filters.teamBoards
                          ? 'Team Boards'
                          : `Organization Boards`}{' '}
                      </Link>
                    </button>
                  </Fragment>
                )}
              </Fragment>
            )}
          </Fragment>
        )}
      </div>
    </div>
  );
}

function LatestActions({
  actions,
  organizationId,
  teamId,
  refetch,
  rowsPerPage,
  setRowsPerPage,
  currentPage,
  totalPages,
  totalActions,
  filterMember,
  setFilterMember,
  showSidebar,
  setShowSidebar,
  loading,
  userId,
  selectedTab,
  retrospectiveId,
  loadingBoards,
  selectedBoard,
  setSelectedBoard,
  isAnonymous,
  userEmail,
}: LatestActionsProps) {
  const {
    data: teamMembers,
    loading: loadingTeamMembers,
    searchMembers: refetchTeamMembers,
  } = useFetchOrganizationTeamMembersMetadata(organizationId, teamId, 10);

  const {
    data: boardMembers,
    loading: loadingBoardMembers,
    loadingSearch,
  } = useFetchBoardMembersMetadata(organizationId, retrospectiveId, 10);

  const { data: rules } = useFetchRules('boards');

  const loadingMembers = loadingTeamMembers || loadingBoardMembers;

  const [currentUserRole, setCurrentUserRole] = useState(0);

  const [isAllowedToUpdate, setIsAllowedToUpdate] = useState(true);
  const [isAllowedToDelete, setIsAllowedToDelete] = useState(true);

  // Check user's current role
  useEffect(() => {
    if (boardMembers) {
      const findUserById = (): TeamMembers | undefined => {
        return boardMembers.find(
          (member: TeamMembers) => member.userId === userId,
        );
      };
      const userFound = findUserById();

      if (userFound && userFound?.active) {
        setCurrentUserRole(userFound.role);
      }
    }
  }, [boardMembers, userId]);

  useEffect(() => {
    if (selectedTab === 2 && selectedBoard && rules) {
      const permissions = boardPermissions(
        selectedBoard,
        rules,
        currentUserRole,
        undefined,
        userId,
        isAnonymous || !userEmail,
        true
      );

      setIsAllowedToUpdate(permissions.isAllowedToUpdate);
      setIsAllowedToDelete(permissions.isAllowedToDelete);
    } else {
      setIsAllowedToUpdate(true);
      setIsAllowedToDelete(true);
    }
  }, [selectedBoard, rules, currentUserRole, selectedTab]);

  function Content({ organizationId, action }: any) {
    const contentRef = useRef(null);

    const formattedDate = showDateHtml(action.date);

    const [showFullText, setShowFullText] = useState(false);
    const [hasOverflow, setHasOverflow] = useState(false);

    const toggleTextVisibility = () => {
      setShowFullText(!showFullText);
    };

    useEffect(() => {
      if (contentRef.current) {
        const { clientHeight, scrollHeight } = contentRef.current;
        if (scrollHeight > clientHeight) {
          setHasOverflow(true);
        }
      }
    });

    return (
      <tr className="hover:bg-zinc-50 max-h-[400px] overflow-auto">
        <td className=" pl-4 py-2 ">
          <div className="flex items-center space-x-2">
            <div className="my-auto">
              <UserImage
                selectedMember={action.assignee}
                organizationId={organizationId}
              />
            </div>
            {action.user.name != '' ? (
              <p className="text-sm font-normal my-auto flex items-center justify-center overflow-hidden">
                {action?.user.name + ' ' + action?.user.lastName}
              </p>
            ) : (
              <p className="text-sm font-normal my-auto flex items-center justify-center overflow-hidden">
                Not assigned
              </p>
            )}
          </div>
        </td>
        <td className="pr-4 py-2 ">
          <Tooltip>
            <If condition={hasOverflow}>
              <TooltipContent side="top">Click to expand text</TooltipContent>
            </If>
            <TooltipTrigger>
              <p
                ref={contentRef}
                className="font-normal text-left text-ellipsis overflow-hidden flex-grow flex-shrink w-[495px] my-auto cursor-pointer"
                style={
                  showFullText
                    ? {
                        display: '-webkit-box',
                        WebkitLineClamp: 'unset',
                        WebkitBoxOrient: 'vertical',
                        overflowWrap: 'anywhere',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        whiteSpace: 'pre-wrap',
                      }
                    : {
                        textOverflow: 'ellipsis',
                        WebkitLineClamp: 1,
                        display: '-webkit-box',
                        WebkitBoxOrient: 'vertical',
                        overflowWrap: 'anywhere',
                        whiteSpace: 'pre-wrap',
                      }
                }
                onClick={toggleTextVisibility}
              >
                {action.description
                  .split('\n')
                  .map((line: any, index: number) => (
                    <Fragment key={index}>
                      {line}
                      <br />
                    </Fragment>
                  ))}
              </p>
            </TooltipTrigger>
          </Tooltip>
        </td>

        <td className="px-4 py-2">
          <div className="flex space-x-2">
            {action.status === 'To do' ? (
              <Image src={toDo} alt="stop-watch" width={24} height={24} />
            ) : action.status === 'In Progress' ? (
              <Image src={stopWatch} alt="stop-watch" width={24} height={24} />
            ) : (
              <Image src={done} alt="stop-watch" width={24} height={24} />
            )}
            <p className="font-normal">{action.status}</p>
          </div>
        </td>

        <td className="px-4 py-2">
          <p
            className="font-normal"
            dangerouslySetInnerHTML={{ __html: formattedDate }}
          ></p>
        </td>
        <If condition={isAllowedToUpdate || isAllowedToDelete}>
          <td className="px-4 py-2">
            <button
              className="w-max"
              onClick={() => {
                setShowSidebar(true), setSelectedAction(action);
              }}
            >
              <Image src={edit} alt="edit"></Image>
            </button>
          </td>
        </If>
      </tr>
    );
  }

  const [selectedAction, setSelectedAction] = useState([]);

  const { myRetrospectives: retrospectives, dropdownSearch } =
    useSearchMyRetrospectives(organizationId, userId, teamId, '');

  const [retrospectiveData, setRetrospectiveData] = useState<Retrospectives[]>(
    [],
  );
  const [hasSet, setHasSet] = useState(false);

  useEffect(() => {
    if (retrospectives.length > 0) {
      setRetrospectiveData(retrospectives);
      if (!hasSet) {
        setSelectedBoard(retrospectives[0]);
        setHasSet(true);
      }
    }
  }, [retrospectives]);

  return (
    <div className="bg-gray-100 p-2  px-8 tv:px-36 ">
      <div className="">
        <SectionHeader
          description={
            'All action items for retrospectives you participated in.'
          }
          redirectTo={'/actions'}
        >
          Latest Action Items ({totalActions})
        </SectionHeader>
      </div>
      {!isAnonymous ? (
        <Fragment>
          <div className="flex items-center space-x-3">
            <div className="py-6">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFilterMember(userId);
                    } else {
                      setFilterMember('Any member');
                    }
                  }}
                  checked={filterMember === userId}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-purple-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                <span className="ml-3 text-sm font-medium text-zinc-600">
                  Only my action items
                </span>
              </label>
            </div>

            <If condition={selectedTab === 2}>
              {loadingBoards ? (
                <LoadingMembersSpinner />
              ) : (
                <div className="w-[450px]">
                  <SearchableDropdown
                    refetch={dropdownSearch}
                    label="name"
                    placeholder={'Type Retrospective Name'}
                    options={retrospectiveData}
                    handleChange={setSelectedBoard}
                    selectedVal={selectedBoard}
                    loading={loadingSearch}
                  />
                </div>
              )}
            </If>
          </div>

          <div className="relative overflow-auto lg:overflow-visible border border-[#E4E4E7] bg-white rounded-md">
            <table className="w-full table-auto">
              {!loading ? (
                <tbody>
                  {actions && actions?.length > 0 ? (
                    actions.map((action: Actions, index: number) => (
                      <Content
                        action={action}
                        organizationId={organizationId}
                        key={index}
                        retrospective={selectedBoard}
                      />
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3}>
                        <p className="py-16 text-center">No action items</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              ) : (
                <tbody>
                  <tr>
                    <td colSpan={3}>
                      <div className="flex items-center justify-center h-[100px]">
                        <LoadingMembersSpinner />
                      </div>
                    </td>
                  </tr>
                </tbody>
              )}
            </table>
          </div>
          <div id="actions" className="mt-6">
            <PaginationController
              rowsPerPage={rowsPerPage}
              setRowsPerPage={setRowsPerPage}
              totalPages={totalPages}
              currentPage={currentPage}
              refetch={refetch}
            />
          </div>

          {showSidebar && (
            <div className="absolute">
              <EditActionSidebarComponent
                setShowSidebar={setShowSidebar}
                action={selectedAction}
                organizationId={organizationId}
                teamId={teamId}
                refetch={refetch}
                teamMembers={selectedTab === 1 ? teamMembers : boardMembers}
                refetchTeamMembers={refetchTeamMembers}
                loadingMembers={loadingMembers}
                selectedTab={selectedTab}
                retrospectiveId={retrospectiveId}
              />
            </div>
          )}
        </Fragment>
      ) : (
        <div className="my-6 relative overflow-auto lg:overflow-visible border border-[#E4E4E7] bg-white rounded-md">
          <p className="w-full text-sm my-6 font-smeibold text-center m-auto">
            You need to be on a team to access the Actions Board
          </p>{' '}
        </div>
      )}
    </div>
  );
}
