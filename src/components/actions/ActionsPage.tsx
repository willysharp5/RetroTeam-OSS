import { useState, useEffect, Fragment } from 'react';
import { useAuth } from 'reactfire';

import Image from 'next/image';

import add from '/public/assets/svg/plus-circled.svg';
import archive from '/public/assets/svg/archive.svg';
import flag from '/public/assets/svg/flag.svg';
import search from 'public/assets/svg/magnifying-glass.svg';

import { HeaderProps, ContentProps } from '~/lib/actions/types/actions';
import { useCurrentOrganization } from '~/lib/organizations/hooks/use-current-organization';
import useFetchActions from '~/lib/server/actions/get-actions';
import useFetchActionBoards from '~/lib/server/board/get-actions';
import { Task, Id } from '~/lib/actions/types/actions';
import { useCurrentTeam } from '~/lib/organizations/hooks/use-current-team';

import { useFetchOrganizationTeamMembersMetadata } from '~/lib/organizations/hooks/use-fetch-team-members-metadata';
import { useFetchBoardMembersMetadata } from '~/lib/board/hooks/use-fetch-board-members-metadata';
import { TeamMembers } from '~/lib/teams/types/teams';
import useFetchRules from '~/lib/server/rules/get-rules';
import { useGetRetrospectives } from '~/lib/retrospectives/hooks/use-get-retrospectives';
import { Retrospectives } from '~/lib/retrospectives/types/retrospectives';

import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '~/core/ui/Select';

import ActionSidebarComponent from './AddActionSideBar';
import Board from './board/Board';
import ArchivedSidebarComponent from './ArchivedSideBarComponent';

import OrganizationTeamMembersSelector from '../organizations/OrganizationTeamMembersSelector';
import LoadingMembersSpinner from '../organizations/LoadingMembersSpinner';

import ActionBoardContainer from './retrospectiveActions/ActionBoardContainer';

import SearchableDropdown from '../shared/searchableDropdown/searchableDropdown';

import If from '~/core/ui/If';
import Link from 'next/link';
import { useSearchMyRetrospectives } from '~/lib/retrospectives/hooks/use-search-my-retrospectives';

export default function ActionsPage() {
  const organization = useCurrentOrganization();
  const id = organization?.id as string;

  const { team } = useCurrentTeam();
  const teamId = team?.id as string;

  const auth = useAuth();
  const user = auth.currentUser;
  const userId = user?.uid as string;

  const [filterDate, setFilterDate] = useState('Filter by date');
  const [selectedMember, setFilterMember] = useState<any>();

  const [showOrgActions, setShowOrgActions] = useState(true);

  const [showAddActionBar, setShowAddActionBar] = useState(false);
  const [showArchivedActionBar, setShowArchivedActionBar] = useState(false);

  const [selectedBoard, setSelectedBoard] = useState<any>();

  const { data, refetch, loading, totalActions } = useFetchActions(
    id,
    selectedMember?.id ? selectedMember.id : 'Any member',
    filterDate,
    teamId,
  );

  const {
    data: teamMembers,
    loading: usersLoading,
    error,
    searchMembers: refetchTeamMembers,
    loadingSearch,
  } = useFetchOrganizationTeamMembersMetadata(id, teamId, 3);

  const {
    data: boardMembers,
    loading: loadingBoardMembers,
    searchMembers,
    loadingSearch: loadingSearchMembers,
  } = useFetchBoardMembersMetadata(id, selectedBoard?.id, 3);

  const {
    data: actionsData,
    refetch: refetchBoardActions,
    loading: loadingBoardActions,
  } = useFetchActionBoards(
    id,
    teamId,
    selectedBoard?.id,
    selectedMember ? selectedMember.id : 'Any member',
    filterDate,
  );

  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksFilter, setTasksFilter] = useState<Task[]>(tasks);

  const [actions, setActions] = useState<Task[]>([]);

  const [isAllowedToCreate, setIsAllowedToCreate] = useState(true);

  useEffect(() => {
    if (data) {
      
      const sortedData = [...data];
      sortedData.sort((a, b) => a.order - b.order);
      setTasks(sortedData);
      setTasksFilter(sortedData);
    }
  }, [data]);

  useEffect(() => {
    
    if (showOrgActions) {
      refetch(
        selectedMember?.id ? selectedMember.id : 'Any member',
        filterDate,
      );
    } else {
      refetchBoardActions(
        selectedMember?.id ? selectedMember.id : 'Any member',
        filterDate,
      );
    }
  }, [selectedMember, filterDate, showOrgActions, selectedBoard]);

  useEffect(() => {
    
    if (actionsData) {
      setActions(actionsData);
    }
  }, [actionsData]);

  function createTask(content: Task) {
    const updatedTasks = [content, ...tasks];

    setTasks(updatedTasks);
    setTasksFilter(updatedTasks);
  }

  function deleteTask(id: Id) {
    const newTasks = tasks.filter((task) => task.id !== id);
    setTasks(newTasks);
    refetch(selectedMember?.id ? selectedMember.id : 'Any member', filterDate);
    setTasksFilter(newTasks);
  }

  function updateTask(id: string, content: Task) {
    const newTasks = tasks.map((task) => {
      if (task.id === id) {
        task = content;
      }
      return task;
    });
    setTasks(newTasks);
    setTasksFilter(newTasks);
  }

  function archiveTask(id: string, archive: boolean) {
    const updatedTasks = tasks.map((task) => {
      if (task.id === id) {
        task.archive = archive;
      }
      return task;
    });

    setTasks(updatedTasks);
    setTasksFilter(updatedTasks);
  }

  function createAction(content: Task) {
    const updatedTasks = [content, ...actions];

    setActions(updatedTasks);
  }

  function deleteAction(id: Id) {
    const newTasks = actions.filter((task) => task.id !== id);
    setActions(newTasks);
  }

  function updateAction(id: string, content: Task) {
    const newTasks = actions.map((task) => {
      if (task.id === id) {
        task = content;
      }
      return task;
    });

    setActions(newTasks);
  }

  function archiveAction(id: string, archive: boolean) {
    const updatedTasks = actions.map((task) => {
      if (task.id === id) {
        task.archive = archive;
      }
      return task;
    });

    setActions(updatedTasks);
  }

  const { data: rules } = useFetchRules('boards');

  return (
    <>
      {(showArchivedActionBar || showAddActionBar) && (
        <div className="fixed top-0 left-0 w-full h-full bg-black opacity-20 z-10 pointer-events-auto "></div>
      )}
      <div
        className={
          'bg-gray-100 flex flex-col pb-36 flex flex-col flex-1 md:overflow-x-hidden overflow-y-auto'
        }
      >
        <Header
          teamId={teamId}
          setShowAddActionBar={setShowAddActionBar}
          setShowArchivedActionBar={setShowArchivedActionBar}
          setFilterMember={setFilterMember}
          showOrgActions={showOrgActions}
          setShowOrgActions={setShowOrgActions}
          isAllowedToCreate={isAllowedToCreate}
        />

        {!usersLoading ? (
          (teamId && !user?.isAnonymous && user?.email) ? (
            <Content
              refetch={showOrgActions ? refetch : refetchBoardActions}
              teamId={teamId}
              organizationId={id}
              tasks={tasksFilter}
              data={tasksFilter}
              setTasks={setTasks}
              setTasksFilter={setTasksFilter}
              createTask={createTask}
              updateTask={updateTask}
              deleteTask={deleteTask}
              archiveTask={archiveTask}
              setFilterMember={setFilterMember}
              selectedMember={selectedMember}
              setFilterDate={setFilterDate}
              filterDate={filterDate}
              teamMembers={showOrgActions ? teamMembers : boardMembers}
              boardMembers={boardMembers}
              loading={showOrgActions ? loading : loadingBoardActions}
              refetchTeamMembers={refetchTeamMembers}
              loadingMembers={loadingSearch || usersLoading}
              userId={userId}
              showOrgActions={showOrgActions}
              organizationData={organization}
              currentUser={user}
              selectedBoard={selectedBoard}
              setSelectedBoard={setSelectedBoard}
              archiveAction={archiveAction}
              createAction={createAction}
              updateAction={updateAction}
              deleteAction={deleteAction}
              actions={actions}
              loadingBoardMembers={loadingBoardMembers}
              searchMembers={searchMembers}
              setIsAllowedToCreate={setIsAllowedToCreate}
            />
          ) : (
            <div className="h-auto m-auto ">
              {!teamId ? (
                <p className="w-full text-2xl font-smeibold text-center m-auto">
                  You need to be on a team to access the Actions Board
                </p>
              ) : (
                <p className="w-full text-2xl font-smeibold text-center m-auto">
                  You need to be signed in to access the Actions Board
                </p>
              )}
            </div>
          )
        ) : (
          <LoadingMembersSpinner />
        )}
      </div>{' '}
      {showAddActionBar && (
        <div className="absolute">
          <ActionSidebarComponent
            teamId={teamId}
            organizationId={id}
            setShowAddActionBar={setShowAddActionBar}
            refetch={showOrgActions ? refetch : refetchBoardActions}
            teamMembers={showOrgActions ? teamMembers : boardMembers}
            refetchTeamMembers={
              showOrgActions ? refetchTeamMembers : searchMembers
            }
            loadingMembers={
              showOrgActions ? loadingSearch : loadingSearchMembers
            }
            retrospectiveId={selectedBoard?.id}
            facilitator={userId}
            createAction={createAction}
            showOrgActions={showOrgActions}
          />
        </div>
      )}
      {showArchivedActionBar && (
        <div className="absolute">
          <ArchivedSidebarComponent
            setShowArchivedActionBar={setShowArchivedActionBar}
            data={showOrgActions ? tasks : actions}
            organizationId={id}
            teamId={teamId}
            updateTask={showOrgActions ? updateTask : updateAction}
            deleteTask={showOrgActions ? deleteTask : deleteAction}
            archiveTask={showOrgActions ? archiveTask : archiveAction}
            teamMembers={showOrgActions ? teamMembers : boardMembers}
            refetchTeamMembers={
              showOrgActions ? refetchTeamMembers : searchMembers
            }
            loadingMembers={
              showOrgActions ? loadingSearch : loadingSearchMembers
            }
            showOrgActions={showOrgActions}
            currentUser={userId}
            retrospectiveId={selectedBoard?.id}
            deleteActions={deleteAction}
            currentUserRole={selectedBoard && selectedBoard?.members[userId]?.role}
            retrospective={selectedBoard}
            rules={rules}
          />
        </div>
      )}
    </>
  );
}

function Header({
  setShowAddActionBar,
  setShowArchivedActionBar,
  teamId,
  showOrgActions,
  isAllowedToCreate,
  setShowOrgActions
}: HeaderProps) {
  const createActionHandler = () => {
    setShowAddActionBar(true);
  };

  return (
    <div className='px-8 tv:px-36 pt-6 pb-5  bg-white border-b border-[#E4E4E7] '>
   <div className=" space-y-5 w-full">
      <div className={`text-sm md:flex justify-between md:space-y-0 space-y-2`}>
        <h1 className="text-3xl font-semibold">Actions</h1>

        {teamId && (
          <div className="md:flex ml-0 md:justify-none items-center space-y-2 md:space-y-0 md:space-x-2">
            <Link href={'/search/actions'}>
              <button className="flex space-x-2 bg-[#F4F4F5] hover:bg-zinc-50 text-black py-2 px-4 rounded-md">
                <Image
                  className="w-4 h-4 m-auto"
                  src={search}
                  alt="search"
                ></Image>
                <p>Search Actions</p>
              </button>
            </Link>
            <div className="flex">
              <button
                onClick={() => setShowArchivedActionBar(true)}
                className=" bg-zinc-100 px-4 py-2 rounded-md font-medium md:ml-auto flex space-x-2 hover:bg-zinc-50"
              >
                <Image src={archive} className="flex" alt="archive" />
                <p>Archived Items</p>
              </button>
            </div>

            <div className="flex">
              <button
                disabled={!isAllowedToCreate}
                onClick={createActionHandler}
                className="md:ml-auto disabled:bg-zinc-700 bg-black hover:bg-zinc-700 text-white flex space-x-2 px-4 py-2 rounded-md"
              >
                <Image src={add} className="flex" alt="archive" />
                <p>{showOrgActions ? 'Organization' : 'Board'} Action item</p>
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="flex space-x-5">
        <Image src={flag} alt="flag" />
        <p className="text-[#71717A] text-sm">
          Manage your action items by moving them from To Do, In-Progress and
          Done. You can also archive your action items and mark them as
          complete, set due dates and assign to members.{' '}
        </p>
      </div>
     
    </div>
     <div className="flex text-sm justify-end">
     <div className="flex overflow-x-hidden flex-wrap text-zinc-400 bg-zinc-200 rounded-lg px-1.5 py-2 ">
       <div
         className={`py-1 px-3 rounded-sm ${
           showOrgActions ? 'bg-white text-zinc-600' : ''
         } hover:bg-zinc-50 hover:text-zinc-500 transition cursor-pointer`}
         onClick={() => setShowOrgActions(true)}
       >
         <p>Organization Action Items</p>
       </div>
       <div
         className={`py-1 px-3 rounded-sm ${
           !showOrgActions ? 'bg-white text-zinc-600' : ''
         } hover:bg-zinc-50 hover:text-zinc-500 transition cursor-pointer`}
         onClick={() => setShowOrgActions(false)}
       >
         <p>Board Action Items</p>
       </div>
     </div>
   </div>
    </div>
 
  );
}

function Content({
  organizationId,
  teamId,
  tasks,
  data,
  refetch,
  createTask,
  updateTask,
  deleteTask,
  setTasks,
  archiveTask,
  setFilterMember,
  selectedMember,
  setTasksFilter,
  setFilterDate,
  filterDate,
  teamMembers,
  boardMembers,
  loading,
  refetchTeamMembers,
  searchMembers,
  loadingMembers,
  userId,
  showOrgActions,
  currentUser,
  organizationData,
  setSelectedBoard,
  selectedBoard,
  createAction,
  updateAction,
  deleteAction,
  archiveAction,
  actions,
  loadingBoardMembers,
  setIsAllowedToCreate,
}: ContentProps) {
  const [retrospectiveData, setRetrospectiveData] = useState<Retrospectives[]>(
    [],
  );

  const [hasSet, setHasSet] = useState(false);

  const [showCard, setShowCard] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState(0);

  const { loading: loadingBoards } = useGetRetrospectives(
    organizationId,
    teamId,
    1,
    'mine',
  );

  const {
    myRetrospectives: retrospectives,
    loadingSearch,
    dropdownSearch,
  } = useSearchMyRetrospectives(organizationId, userId, teamId, '');
  const { data: rules } = useFetchRules('boards');

  useEffect(() => {
    
    if (retrospectives.length > 0) {
      setRetrospectiveData(retrospectives);
      if (!hasSet) {
        setSelectedBoard(retrospectives[0]);
        setHasSet(true);
      }
    }
  }, [retrospectives]);

  // Check user's current role
  useEffect(() => {
    
    if (selectedBoard && currentUser) {
      const findUserById = (): TeamMembers | undefined => {
        return selectedBoard.members[currentUser.uid];
      };
      const userFound = findUserById();
      if (userFound) {
        if (!userFound.active) {
        }
        setCurrentUserRole(userFound.role);
      }
    }
  }, [selectedBoard, currentUser]);

  useEffect(() => {
    
    if (showOrgActions) {
      setIsAllowedToCreate(true);
    } else {
      if (selectedBoard && rules) {
        if (selectedBoard.finished) {
          if (currentUserRole > 0) {
            if (rules.allowCreateCardsOnceFinished) {
              setIsAllowedToCreate(true);
            } else {
              setIsAllowedToCreate(false);
            }
          } else if (rules.allowMembersComment) {
            setIsAllowedToCreate(true);
          } else {
            setIsAllowedToCreate(false);
          }
        } else {
          if (rules.allowMembersComment || currentUserRole > 0) {
            setIsAllowedToCreate(true);
          } else {
            setIsAllowedToCreate(false);
          }
        }
      }
    }
  }, [selectedBoard, rules, currentUserRole, showOrgActions]);

  return (
    <div className="bg-gray-100 py-6 px-8 tv:px-36 relative">
      <div className="md:flex w-auto md:space-x-5 space-y-5 md:space-y-0 items-center">
        <div className="md:w-auto bg-white">
          <Select
            value={filterDate}
            onValueChange={(value) => {
              setFilterDate(value);
            }}
          >
            <SelectTrigger data-cy={'role-selector-trigger'}>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem
                key={'filter-date'}
                data-cy={'filter-date'}
                value={'Filter by date'}
              >
                <p>Filter by date</p>
              </SelectItem>
              <SelectItem
                key={'no-date'}
                data-cy={'filter-date'}
                value={'No due date'}
              >
                <p>No due date</p>
              </SelectItem>
              <SelectItem
                key={'overdue'}
                data-cy={'filter-date'}
                value={'Overdue'}
              >
                <p>Overdue</p>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-auto">
          <OrganizationTeamMembersSelector
            selectedMember={selectedMember}
            setFilterMember={setFilterMember}
            organizationId={organizationId}
            teamId={teamId}
            showOrgActions={showOrgActions}
            selectedBoard={selectedBoard}
            searchBoardMembers={searchMembers}
            boardMetadataMembers={showOrgActions ? teamMembers : boardMembers}
          />
        </div>
        <If condition={!showOrgActions}>
          {loadingBoards ? (
            <LoadingMembersSpinner />
          ) : (
            <div className="">
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
    
      {showOrgActions ? (
        <Fragment>
          {loading ? (
            <div className="flex items-center justify-center h-[100px]">
              <LoadingMembersSpinner />
            </div>
          ) : (
            <Board
              refetch={refetch}
              actions={data}
              teamId={teamId}
              organizationId={organizationId}
              createTask={createTask}
              updateTask={updateTask}
              deleteTask={deleteTask}
              archiveTask={archiveTask}
              setTasks={setTasks}
              setTasksFilter={setTasksFilter}
              teamMembers={teamMembers}
              refetchTeamMembers={refetchTeamMembers}
              loadingMembers={loadingMembers}
              organizationData={organizationData}
            ></Board>
          )}
        </Fragment>
      ) : (
        <div className="absolute h-auto mt-10 flex px-8 w-full items-start gap-2 lg:gap-20 justify-start overflow-auto  items-start py-3 px-4">
          <div className="flex space-x-2 w-full justify-center overflow-x-auto xl:overflow-visible">
            {!loading ? (
              <ActionBoardContainer
                organizationId={organizationId}
                teamId={teamId}
                retrospectiveId={selectedBoard?.id}
                retrospective={selectedBoard}
                actions={actions}
                createAction={createAction}
                updateAction={updateAction}
                deleteAction={deleteAction}
                archiveAction={archiveAction}
                teamMembers={boardMembers}
                currentUser={currentUser}
                currentUserRole={currentUserRole}
                rules={rules}
                showCard={showCard === 'action'}
                setShowCard={setShowCard}
                organizationData={organizationData}
                refetchTeamMembers={searchMembers}
                loadingMembers={loadingBoardMembers}
              />
            ) : (
              <div className="flex items-center justify-center h-[100px]">
                <LoadingMembersSpinner />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
