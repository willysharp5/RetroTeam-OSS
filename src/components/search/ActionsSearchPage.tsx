import { useState, useEffect, useCallback, Fragment } from 'react';
import { useAuth } from 'reactfire';
import toaster from 'react-hot-toast';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '~/core/ui/Select';

import FilterBox from '../shared/filterbox';
import DatePickerRange from '../shared/datepickerRange';
import Card from '../shared/action/card';

import { useCurrentOrganization } from '~/lib/organizations/hooks/use-current-organization';
import { useCurrentTeam } from '~/lib/organizations/hooks/use-current-team';

import useSearchActionsAssignees from '~/lib/server/search/use-search-actions-assignees';
import useSearchActions from '~/lib/server/search/use-search-actions';

import { showDatePickerValue } from '../utils/dateformatter';
import { useSearchMyRetrospectives } from '~/lib/retrospectives/hooks/use-search-my-retrospectives';
import LoadingMembersSpinner from '../organizations/LoadingMembersSpinner';
import PaginationController from '../shared/paginationController';
import useUpdateActions from '~/lib/actions/hooks/update-actions';
import useArchiveActions from '~/lib/actions/hooks/use-archive-actions';
import { default as useUpdateBoardActions } from '~/lib/board/hooks/use-update-action';
import { default as useArchiveBoardActions } from '~/lib/board/hooks/use-archive-action';
import useDeleteBoardAction from '~/lib/board/hooks/use-delete-action-put';
import UpdateActionCard from '../shared/action/updateCard';
import { boardPermissions } from '../utils/boardPermissions';
import useFetchRules from '~/lib/server/rules/get-rules';
import DeleteModal from '~/components/shared/deleteModal';
import { useFetchOrganizationTeamMembersMetadata } from '~/lib/organizations/hooks/use-fetch-team-members-metadata';
import useDeleteAction from '~/lib/actions/hooks/delete-actions-put';
import { useFetchBoardMembersMetadata } from '~/lib/board/hooks/use-fetch-board-members-metadata';
import { Retrospectives } from '~/lib/retrospectives/types/retrospectives';
import If from '~/core/ui/If';

const DEFAULT_ROWS = 10;

interface ContentProps {
  results: any[];
  loading: boolean;
  organizationId: string;
  boards: any[];
  teamMembers: any[];
  loadingBoards: boolean;
  loadingTeamsSearch: boolean;
  currentUserId: string;
  boardName: string;
  setBoardName: (name: string) => void;
  setSelectedBoards: any;
  selectedBoards: string[];
  selectedFilterAssignees: string[];
  setSelectedFilterAssignees: any;
  selectedDueDate: any;
  setSelectedDueDate: any;
  onSearch: (loading?: boolean) => void;
  rowsPerPage: number;
  setRowsPerPage: (rows: number) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  subscriptionId: string;
  currentUser: any;
  teamId: string;
  totalOrganizationActions: number;
  refetchTeamMembers: (text: string) => void;
  isAnonymous: boolean;
  organization: any;
}

export default function ActionsSearchPage() {
  const organization = useCurrentOrganization();
  const organizationId = organization?.id as string;

  const subscription = organization?.subscription;
  const subscriptionId = subscription?.priceId;

  const auth = useAuth();
  const currentUser = auth.currentUser;
  const userId = currentUser?.uid as string;

  const { team } = useCurrentTeam();
  const teamId = team?.id as string;

  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const [archive, setArchive] = useState('');
  const [dateRange, setDateRange] = useState<any>({
    startDate: undefined,
    endDate: undefined,
  });

  const [results, setResults] = useState<any>([]);
  const [loading, setLoading] = useState(false);

  const [boards, setBoards] = useState<any>([]);
  const [teamMembers, setTeamMembers] = useState<any>([]);

  const [selectedBoards, setSelectedBoards] = useState([]);
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [selectedDueDate, setSelectedDueDate] = useState([]);

  const { trigger: search } = useSearchActions();

  const [boardName, setBoardName] = useState('');

  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const [totalOrganizationActions, setTotalOrganizationActions] = useState(0);

  const onSearch = useCallback(
    async (changeloading = true) => {
      if (changeloading) {
        setLoading(true);
      }

      const selectedBoardsIds = selectedBoards.map((board: any) => board.id);
      const selectedUsersIds = selectedAssignees.map(
        (user: any) => user.document.userId,
      );
      const selectedDueDates = selectedDueDate.map((date: any) => date.name);

      const myBoardsId = boards.map((board: any) => board.id);

      const body = {
        query: name,
        organizationFilter: organizationId,
        teamFilter: teamId,
        status: status,
        archive: archive,
        startDate: dateRange?.startDate
          ? new Date(dateRange.startDate).getTime()
          : undefined,
        endDate: dateRange?.endDate
          ? new Date(dateRange.endDate).getTime()
          : undefined,
        selectedUsersIds: selectedUsersIds,
        boardFilter: selectedBoardsIds,
        myBoardsId: myBoardsId,
        selectedDueDates: selectedDueDates,
        rowsPerPage: rowsPerPage,
        currentPage: currentPage,
        isOnlyOrganization:
          selectedBoardsIds.length > 0
            ? false
            : myBoardsId.length > 0
            ? false
            : true,
      };
      search(body)
        .then((res: any) => {
          setCurrentPage(res.page);
          const totalPages = Math.ceil(res.found / rowsPerPage);
          setTotalPages(totalPages);
          const results = res.hits;
          setResults(results);
          setLoading(false);
        })
        .catch((e) => {
          console.error('ERROR onSearch', e);
          setLoading(false);
        });
    },
    [
      search,
      name,
      status,
      archive,
      organizationId,
      teamId,
      selectedBoards,
      selectedAssignees,
      selectedDueDate,
      dateRange,
      rowsPerPage,
      currentPage,
      boards,
    ],
  );

  const onSearchTotalOrganizationActions = useCallback(async () => {
    const body = {
      query: '',
      organizationFilter: organizationId,
      teamFilter: teamId,
      status: '',
      archive: 'organizations',
      startDate: undefined,
      isOnlyOrganization: true,
    };
    search(body)
      .then((res: any) => {
        const results = res.hits;
        setTotalOrganizationActions(results.length);
      })
      .catch((e) => {
        console.error('ERROR onSearch', e);
        setLoading(false);
      });
  }, [search, organizationId, teamId]);

  useEffect(() => {
    onSearchTotalOrganizationActions();
  }, []);

  useEffect(() => {
    onSearch();
  }, [
    name,
    status,
    archive,
    organizationId,
    selectedBoards,
    selectedAssignees,
    selectedDueDate,
    userId,
    teamId,
    dateRange,
    rowsPerPage,
    currentPage,
    boards,
  ]);

  const {
    myRetrospectives: retrospectives,
    loading: loadingRetrospectives,
    loadingSearch,
  } = useSearchMyRetrospectives(organizationId, userId,teamId, boardName);

  const {
    data: teamMembersData,
    loading: usersLoading,
    error,
    searchMembers: refetchTeamMembers,
    loadingSearch: loadingTeamsSearch,
  } = useFetchOrganizationTeamMembersMetadata(organizationId, teamId, 3);

  const loadingBoards = loadingRetrospectives || loadingSearch;

  useEffect(() => {
    if (retrospectives) {
      setBoards(retrospectives);
    }
  }, [retrospectives]);

  useEffect(() => {
    if (teamMembersData) {
      setTeamMembers(teamMembersData);
    }
  }, [teamMembersData]);

  return (
    <>
      <div
        className={`flex flex-col  pb-36 flex flex-col flex-1 md:overflow-x-hidden overflow-y-auto ${
          (!currentUser?.email || currentUser?.isAnonymous) && 'bg-gray-100'
        }`}
      >
        <Header
          name={name}
          setName={setName}
          status={status}
          setStatus={setStatus}
          dateRange={dateRange}
          setDateRange={setDateRange}
          archive={archive}
          setArchive={setArchive}
          currentUser={currentUser}
        />
        <If condition={!currentUser?.isAnonymous && currentUser?.email}>
          <Content
            results={results}
            loading={loading}
            subscriptionId={subscriptionId}
            organizationId={organizationId}
            currentUser={currentUser}
            boards={boards}
            teamMembers={teamMembers}
            currentUserId={userId}
            boardName={boardName}
            setBoardName={setBoardName}
            selectedBoards={selectedBoards}
            setSelectedBoards={setSelectedBoards}
            selectedFilterAssignees={selectedAssignees}
            setSelectedFilterAssignees={setSelectedAssignees}
            selectedDueDate={selectedDueDate}
            setSelectedDueDate={setSelectedDueDate}
            teamId={teamId}
            loadingBoards={loadingBoards}
            loadingTeamsSearch={loadingTeamsSearch}
            onSearch={onSearch}
            rowsPerPage={rowsPerPage}
            setRowsPerPage={setRowsPerPage}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
            totalOrganizationActions={totalOrganizationActions}
            refetchTeamMembers={refetchTeamMembers}
            isAnonymous={currentUser?.isAnonymous || !currentUser?.email}
            organization={organization}
          />
        </If>
        <If condition={currentUser?.isAnonymous || !currentUser?.email}>
          <div className="px-16 py-6 tv:px-36 flex flex-col flex-1 overflow-auto pt-6 space-y-5 pb-5 w-full border-t border-[#E4E4E7] items-center">
            <p className="w-full text-2xl text-center  font-smeibold text-center m-auto">
              You need to be signed in to access the Search Page
            </p>
          </div>
        </If>
      </div>{' '}
    </>
  );
}

function Header({
  name,
  setName,
  status,
  setStatus,
  archive,
  setArchive,
  dateRange,
  setDateRange,
  currentUser,
}: any) {
  const currentPath = usePathname() ?? '';

  const handleValueChange = (newValue: any) => {
    setDateRange(newValue);
  };

  return (
    <div className="px-4 md:px-2 2xl:px-16 py-6 tv:px-16  pt-12 bg-white space-y-5 pb-5 w-full">
      <div className={`text-sm md:flex justify-between md:space-y-0 space-y-2`}>
        <h1 className="text-2xl text-center md:text-3xl font-semibold">
          Search - Actions
        </h1>

        <div className="xl:flex justify-between space-y-5 xl:space-y-0">
          <div className="md:flex overflow-x-hidden flex-wrap  text-zinc-400 bg-zinc-100 rounded-lg px-1.5 py-2 ">
            <div
              className={`py-1 px-3 rounded-sm ${
                currentPath === '/search/retrospectives'
                  ? 'bg-white text-zinc-600'
                  : ''
              } hover:bg-zinc-50 hover:text-zinc-500 transition cursor-pointer`}
            >
              <Link href={'/search/retrospectives'}>
                <p>{`Retrospectives Search`}</p>
              </Link>
            </div>
            <div
              className={`py-1 px-3 rounded-sm ${
                currentPath === '/search/actions'
                  ? 'bg-white text-zinc-600'
                  : ''
              } hover:bg-zinc-50 hover:text-zinc-500 transition cursor-pointer`}
            >
              {' '}
              <Link href={'/search/actions'}>
                <p>Actions Search</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <If condition={!currentUser?.isAnonymous && currentUser?.email}>
        <div className="md:flex space-y-5 md:space-y-0 md:space-x-5 bg-gray-100 rounded-md p-4 items-center">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="md:w-[543px] w-full rounded-md border py-4 px-2"
            placeholder="Search by Action Name"
          />
          <div className="md:w-[200px]">
            <Select
              value={status === '' ? 'all' : status}
              onValueChange={(value) => setStatus(value === 'all' ? '' : value)}
            >
              <SelectTrigger data-cy={'role-selector-trigger'}>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem key={'all'} data-cy={'filter-status'} value="all">
                  <p>All</p>
                </SelectItem>
                <SelectItem
                  key={'To do'}
                  data-cy={'filter-status'}
                  value={'To do'}
                >
                  <p>To do</p>
                </SelectItem>
                <SelectItem
                  key={'In Progress'}
                  data-cy={'filter-status'}
                  value={'In Progress'}
                >
                  <p>In Progress</p>
                </SelectItem>
                <SelectItem
                  key={'Done'}
                  data-cy={'filter-status'}
                  value={'Done'}
                >
                  <p>Done</p>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:w-[300px]">
            <Select
              value={archive === '' ? 'all' : archive}
              onValueChange={(value) => setArchive(value === 'all' ? '' : value)}
            >
              <SelectTrigger data-cy={'role-selector-trigger'}>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem key={'all'} data-cy={'filter-active'} value="all">
                  <p>All</p>
                </SelectItem>
                <SelectItem
                  key={'organization'}
                  data-cy={'filter-active'}
                  value={'organization'}
                >
                  <p>Organization Actions</p>
                </SelectItem>
                <SelectItem
                  key={'archive'}
                  data-cy={'filter-active'}
                  value={'archive'}
                >
                  <p>Archive</p>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DatePickerRange
            value={dateRange}
            handleValueChange={handleValueChange}
          />
        </div>
      </If>
    </div>
  );
}

function Content({
  results,
  loading,
  organizationId,
  boards,
  teamMembers,
  refetchTeamMembers,
  loadingBoards,
  teamId,
  boardName,
  setBoardName,
  setSelectedBoards,
  selectedBoards,
  selectedFilterAssignees,
  setSelectedFilterAssignees,
  selectedDueDate,
  setSelectedDueDate,
  onSearch,
  rowsPerPage,
  setRowsPerPage,
  currentPage,
  setCurrentPage,
  totalPages,
  currentUserId,
  isAnonymous,
  totalOrganizationActions,
  organization
}: ContentProps) {
  const { trigger: searchAssignees } = useSearchActionsAssignees();

  const [name, setName] = useState('');
  const [dateName, setDateName] = useState('');

  const dateFilters = [
    {
      name: 'Due Date',
      id: 'duedate',
    },
    {
      name: 'No Due Date',
      id: 'noduedate',
    },
    {
      name: 'Overdue',
      id: 'overdue',
    },
  ];

  const [dateOptions, setDateOptions] = useState(dateFilters);

  useEffect(() => {
    if (dateName) {
      const filtered = dateFilters.filter((date) =>
        date.name.toLowerCase().includes(dateName.toLowerCase()),
      );
      setDateOptions(filtered);
    } else {
      setDateOptions(dateFilters);
    }
  }, [dateName]);

  const [assignees, setAssignees] = useState<any>([]);
  const [loadingAssignees, setLoadingAssignees] = useState(false);

  const [assigneesRowsPerPage, setAssigneesRowsPerPage] = useState(4);
  const [assigneesCurrentPage, setAssigneesCurrentPage] = useState(1);
  const [assigneesTotalPages, setAssigneesTotalPages] = useState(0);

  const handleAssigneesPage = (page: number) => {
    setAssigneesCurrentPage(page);
  };

  const onSearchAssignees = useCallback(async () => {
    setLoadingAssignees(true);
    const body = {
      query: name,
      organizationFilter: organizationId,
      rowsPerPage: assigneesRowsPerPage,
      currentPage: assigneesCurrentPage,
      teamId: teamId,
    };
    searchAssignees(body)
      .then((res: any) => {
        setAssigneesCurrentPage(res.page);
        const totalPages = Math.ceil(res.found / assigneesRowsPerPage);
        setAssigneesTotalPages(totalPages);
        const results = res.hits;
        setAssignees(results);
        setLoadingAssignees(false);
      })
      .catch((e) => {
        console.error('ERROR onSearchCreators', e);
        setLoadingAssignees(false);
      });
  }, [
    searchAssignees,
    name,
    organizationId,
    teamId,
    assigneesRowsPerPage,
    assigneesCurrentPage,
  ]);

  useEffect(() => {
    onSearchAssignees();
  }, [name, assigneesRowsPerPage, assigneesCurrentPage]);

  const handleResultsPage = (page: number) => {
    setCurrentPage(page);
  };

  const { data: rules } = useFetchRules('boards');

  // Update BOARD card functions

  const { trigger: updateBoardActions } = useUpdateBoardActions();
  const { trigger: archiveBoardActions } = useArchiveBoardActions();
  const { trigger: deleteBoardActions } = useDeleteBoardAction();

  // Update ORGANIZATION card functions

  const { trigger: updateActions } = useUpdateActions(organizationId);
  const { trigger: archiveActions } = useArchiveActions(organizationId);
  const { trigger: deleteAction } = useDeleteAction();

  const [selectedAssignees, setSelectedAssignees] = useState<any>([]);
  const [selectedDates, setSelectedDates] = useState<any>([]);
  const [selectedStatus, setSelectedStatus] = useState<any>([]);
  const [descriptions, setDescriptions] = useState<any>([]);

  useEffect(() => {
    if (results.length > 0) {
      const assigneesWithId = results.reduce((acc: any, item: any) => {
        const id =
          item.document?.retrospective !== 'empty'
            ? item.document?.retrospective
            : item.document?.team;
        if (id) {
          acc[id + item.document.id] = item.document.assignee;
        }
        return acc;
      }, {});

      const datesWithId = results.reduce((acc: any, item: any) => {
        const id =
          item.document?.retrospective !== 'empty'
            ? item.document?.retrospective
            : item.document?.team;
        const action = item.document;
        if (id) {
          const timestamp =
            action.date === 0
              ? null
              : (new Date(action.date).toISOString() as any);
          const date =
            timestamp === null ? undefined : showDatePickerValue(timestamp);

          acc[id + item.document.id] = date;
        }
        return acc;
      }, {});

      const statusWithId = results.reduce((acc: any, item: any) => {
        const id =
          item.document?.retrospective !== 'empty'
            ? item.document?.retrospective
            : item.document?.team;
        const action = item.document;
        if (id) {
          acc[id + item.document.id] = action.status;
        }
        return acc;
      }, {});

      const descriptionsWithId = results.reduce((acc: any, item: any) => {
        const id =
          item.document?.retrospective !== 'empty'
            ? item.document?.retrospective
            : item.document?.team;
        const action = item.document;
        if (id) {
          acc[id + item.document.id] = action.description;
        }
        return acc;
      }, {});

      setSelectedAssignees(assigneesWithId);
      setSelectedDates(datesWithId);
      setSelectedStatus(statusWithId);
      setDescriptions(descriptionsWithId);
    }
  }, [results]);

  const [editCard, setEditCard] = useState('');

  const UpdateAction = async (
    action: any,
    description: string,
    selectedMember: string,
    selectedDate: any,
    archive: boolean,
    status: string,
    type: string,
  ) => {
    const ActionDate =
      selectedDate === 0
        ? ''
        : selectedDate != null
        ? new Date(selectedDate)
        : '';

    const body = {
      id: action.id,
      description: description,
      assignee: selectedMember,
      organization: organizationId,
      date: ActionDate,
      status: status,
      archive: archive,
      order: action.order,
      facilitator: currentUserId,
      teamId: action.team,
    };
    const promise = updateActions(body)
      .then((res: any) => {
        if (res.success) {
          setTimeout(() => {
            onSearchAssignees();
            onSearch(false);
          }, 3000);
          setEditCard('');
        }
      })
      .catch((e) => {
        console.error('ERROR updateActions', e);
      });
    if (type === 'member') {
      await toaster.promise(promise, {
        loading: 'Updating Assignee',
        success: 'Assignee Updated',
        error: 'Error updating assignee',
      });
    } else if (type === 'date') {
      await toaster.promise(promise, {
        loading: 'Updating Due Date',
        success: 'Due Date Updated',
        error: 'Error updating due date',
      });
    } else {
      await toaster.promise(promise, {
        loading: 'Updating comment',
        success: 'Comment has been updated',
        error: 'Error updating comment',
      });
    }
  };

  const ArchiveAction = async (action: any, archive: boolean) => {
    const body = {
      id: action.id,
      archive: archive,
      organization: organizationId,
      teamId: action.team,
    };

    const promise = archiveActions(body)
      .then((res: any) => {
        if (res.success) {
          setTimeout(() => {
            onSearch();
          }, 2000);
        }
      })
      .catch((e) => {
        console.error('ERROR ArchiveAction', e);
      });
    await toaster.promise(promise, {
      loading: archive ? 'Archiving action' : 'Restoring action',
      success: archive
        ? 'Action has been archived'
        : 'Action has been restored',
      error: archive ? 'Error archiving action' : 'Error restoring action',
    });
  };

  const DeleteAction = async (id: string, teamId: string) => {
    const body = {
      id: id,
      organizationId,
      teamId,
    };
    const promise = deleteAction(body)
      .then((res: any) => {
        if (res.success) {
          closeDeleteModalHandler();
          setTimeout(() => {
            onSearch(true);
            onSearchAssignees();
          }, 3000);
        }
      })
      .catch((e) => {
        console.error('ERROR deleteActions', e);
      });

    await toaster.promise(promise, {
      loading: 'Deleting action',
      success: 'Action has been deleted',
      error: 'Error deleting action',
    });
  };

  const UpdateBoardAction = async (
    action: any,
    type: string,
    retrospectiveId: string,
    value: any,
  ) => {
    const ActionDate = action.date === 0 ? '' : new Date(action.date);

    const body = {
      id: action.id,
      description: action.description,
      assignee: type === 'member' ? value : action.assignee,
      organization: organizationId,
      date: type === 'date' ? value : ActionDate,
      order: action.order,
      teamId: action.team,
      retrospectiveId: retrospectiveId,
      facilitator: currentUserId,
      status: action.status,
    };

    const promise = updateBoardActions(body)
      .then((res: any) => {
        if (res.success) {
          setTimeout(() => {
            onSearchAssignees();
            onSearch(false);
          }, 2000);
          setEditCard('');
        }
      })

      .catch((e: any) => {
        console.error('ERROR updateBoardActions', e);
      });
    if (type === 'member') {
      await toaster.promise(promise, {
        loading: 'Updating Assignee',
        success: 'Assignee Updated',
        error: 'Error updating assignee',
      });
    } else if (type === 'date') {
      await toaster.promise(promise, {
        loading: 'Updating Due Date',
        success: 'Due Date Updated',
        error: 'Error updating due date',
      });
    } else {
      await toaster.promise(promise, {
        loading: 'Updating comment',
        success: 'Comment has been updated',
        error: 'Error updating comment',
      });
    }
  };

  const updateBoardActionHandler = async (
    id: string,
    retrospectiveId: string,
    status: string,
    description: string,
    assignee: string,
    date: any,
    action: any,
  ) => {
    const ActionDate = date === 0 ? '' : new Date(date);

    const body = {
      id: id,
      description: description,
      assignee: assignee,
      organization: organizationId,
      date: ActionDate,
      order: action.order,
      teamId: action.team,
      retrospectiveId: retrospectiveId,
      facilitator: currentUserId,
      status: status,
    };

    const promise = updateBoardActions(body)
      .then((res: any) => {
        if (res.success) {
          setTimeout(() => {
            onSearchAssignees();
            onSearch(false);
          }, 2000);
          setEditCard('');
        }
      })
      .catch((e: any) => {
        console.error('ERROR updateBoardActions', e);
      });
    await toaster.promise(promise, {
      loading: 'Updating comment',
      success: 'Comment has been updated',
      error: 'Error updating comment',
    });
  };

  const ArchiveBoardAction = async (
    actionId: string,
    retrospectiveId: string,
    archive: boolean,
  ) => {
    const body = {
      id: actionId,
      organization: organizationId,
      retrospectiveId: retrospectiveId,
      archive: archive,
    };
    const promise = archiveBoardActions(body)
      .then((res: any) => {
        setTimeout(() => {
          onSearch();
        }, 2000);
      })
      .catch((e) => {
        console.error('ERROR deleteActions', e);
      });
    await toaster.promise(promise, {
      loading: archive ? 'Archiving action' : 'Restoring action',
      success: archive
        ? 'Action has been archived'
        : 'Action has been restored',
      error: archive ? 'Error archiving action' : 'Error restoring action',
    });
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState('');

  const handleShowDeleteModal = (id: string) => {
    setDeleteItemId(id);
    setShowDeleteModal(true);
  };

  const closeDeleteModalHandler = () => {
    setShowDeleteModal(false);
  };

  const DeleteBoardAction = async (
    retrospectiveId: string,
    actionId: string,
  ) => {
    const body = {
      retrospectiveId,
      id: actionId,
      organizationId,
    };

    const promise = deleteBoardActions(body)
      .then((res: any) => {
        if (res.success) {
          closeDeleteModalHandler();
          setTimeout(() => {
            onSearch();
            onSearchAssignees();
          }, 3000);
        }
      })
      .catch((e: any) => {
        console.error('ERROR deleteActions', e);
      });

    await toaster.promise(promise, {
      loading: 'Deleting action',
      success: 'Action has been deleted',
      error: 'Error deleting action',
    });
  };

  const [boardOptions, setBoardOption] = useState<any>([]);

  useEffect(() => {
    const updatedBoards = [
      {
        name: 'Organization Actions',
        id: 'empty',
        actionsCount: totalOrganizationActions,
      },
      ...boards,
    ];

    setBoardOption(updatedBoards);
  }, [boards, totalOrganizationActions]);

  return (
    <div className="py-6 px-4 md:px-2 2xl:px-16 relative">
      <div className="md:flex justify-between gap-6 w-full">
        <div className="space-y-6 2xl:w-1/4">
          <FilterBox
            name={name}
            setName={setName}
            data={assignees}
            placeholder={'Assigned'}
            setSelectedValues={setSelectedFilterAssignees}
            selectedValues={selectedFilterAssignees}
            nameAccessKey={'document.fullName'}
            numberAccessKey={'document.actionsCount'}
            loading={loadingAssignees}
            pagination={true}
            rowsPerPage={assigneesRowsPerPage}
            setRowsPerPage={setAssigneesRowsPerPage}
            totalPages={assigneesTotalPages}
            currentPage={assigneesCurrentPage}
            refetch={handleAssigneesPage}
            hasLimit={250}
          />
          <FilterBox
            name={boardName}
            setName={setBoardName}
            data={boardOptions}
            placeholder={'Boards'}
            setSelectedValues={setSelectedBoards}
            selectedValues={selectedBoards}
            nameAccessKey={'name'}
            numberAccessKey={'actionsCount'}
            loading={loadingBoards}
          />
          <FilterBox
            name={dateName}
            setName={setDateName}
            data={dateOptions}
            placeholder={'Due date'}
            setSelectedValues={setSelectedDueDate}
            selectedValues={selectedDueDate}
            loading={false}
          />
        </div>
        <div className="h-fit 2xl:w-3/4 w-full">
          <div className="md:bg-gray-100 mt-4 md:mt-0 md:p-4 ">
            {!loading ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 tv:grid-cols-3 gap-4">
                {results &&
                  rules &&
                  boards &&
                  results?.map((item: any, index: number) => (
                    <ResultCard
                      key={`actions-card-${item.document.id}`}
                      action={item.document}
                      boards={boards}
                      editCard={editCard}
                      selectedStatus={selectedStatus}
                      descriptions={descriptions}
                      setSelectedStatus={setSelectedStatus}
                      setDescriptions={setDescriptions}
                      selectedAssignees={selectedAssignees}
                      setSelectedAssignees={setSelectedAssignees}
                      organizationId={organizationId}
                      index={index}
                      selectedDates={selectedDates}
                      setSelectedDates={setSelectedDates}
                      setEditCard={setEditCard}
                      showDeleteModal={showDeleteModal}
                      setShowDeleteModal={setShowDeleteModal}
                      deleteItemId={deleteItemId}
                      handleShowDeleteModal={handleShowDeleteModal}
                      updateBoardActionHandler={updateBoardActionHandler}
                      ArchiveBoardAction={ArchiveBoardAction}
                      ArchiveAction={ArchiveAction}
                      DeleteBoardAction={DeleteBoardAction}
                      DeleteAction={DeleteAction}
                      refetchTeamMembers={refetchTeamMembers}
                      rules={rules}
                      teamMembers={teamMembers}
                      setDeleteItemId={setDeleteItemId}
                      currentUserId={currentUserId}
                      UpdateAction={UpdateAction}
                      UpdateBoardAction={UpdateBoardAction}
                      isAnonymous={isAnonymous}
                      organization={organization}
                    />
                  ))}
              </div>
            ) : (
              <div className="flex py-8 justify-center">
                <LoadingMembersSpinner />
              </div>
            )}
          </div>
          <div className={'flex mt-6 justify-end space-x-2.5'}>
            <PaginationController
              rowsPerPage={rowsPerPage}
              setRowsPerPage={setRowsPerPage}
              totalPages={totalPages}
              currentPage={currentPage}
              refetch={handleResultsPage}
              hasLimit={250}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultCard({
  action,
  boards,
  editCard,
  selectedStatus,
  descriptions,
  setSelectedStatus,
  setDescriptions,
  selectedAssignees,
  setSelectedAssignees,
  organizationId,
  index,
  selectedDates,
  setSelectedDates,
  setEditCard,
  showDeleteModal,
  setShowDeleteModal,
  deleteItemId,
  handleShowDeleteModal,
  updateBoardActionHandler,
  ArchiveBoardAction,
  ArchiveAction,
  DeleteBoardAction,
  DeleteAction,
  refetchTeamMembers,
  rules,
  teamMembers,
  setDeleteItemId,
  currentUserId,
  isAnonymous,
  UpdateAction,
  UpdateBoardAction,
  organization
}: any) {
  const board = boards.find(
    (item: Retrospectives) => item.id === action.retrospective,
  );

  const {
    data: boardMembers,
    loading: loadingBoardMembers,
    searchMembers,
    loadingSearch: loadingSearchMembers,
  } = useFetchBoardMembersMetadata(organizationId, action.retrospective, '');

  const [currentUser, setCurrentUser] = useState<any>();
  const [once, setOnce] = useState(false);

  useEffect(() => {
    if (boardMembers && !once) {
    }
    const currentUser = boardMembers.find(
      (item: any) => item.userId === currentUserId,
    );
    setCurrentUser(currentUser);
    setOnce(true);
  }, [boardMembers, currentUserId, once]);

  const [isAllowedToUpdate, setIsAllowedToUpdate] = useState(false);
  const [isAllowedToDelete, setIsAllowedToDelete] = useState(false);

  useEffect(() => {
    if (action) {
      if (currentUser && board && action.retrospective !== 'empty') {
        const permissions = boardPermissions(
          board,
          rules,
          currentUser?.role,
          action,
          currentUserId,
          isAnonymous,
          true,
        );
        setIsAllowedToUpdate(permissions.isAllowedToUpdate);
        setIsAllowedToDelete(permissions.isAllowedToDelete);
      } else {
        setIsAllowedToDelete(true);
        setIsAllowedToUpdate(true);
      }
    }
  }, [board, rules, action, boardMembers, currentUser]);

  const id =
    action?.retrospective !== 'empty' ? action.retrospective : action?.team;

  return (
    <div className="h-full">
      {editCard === action.id ? (
        <UpdateActionCard
          status={selectedStatus[id + action.id]}
          setStatus={(newState) =>
            setSelectedStatus((prev: any) => ({
              ...prev,
              [id + action.id]: newState,
            }))
          }
          description={descriptions[id + action.id] || ''}
          setDescription={(newDescription) =>
            setDescriptions((prev: any) => ({
              ...prev,
              [id + action.id]: newDescription,
            }))
          }
          teamMembers={
            action.retrospective !== 'empty' ? boardMembers : teamMembers
          }
          selectedMember={selectedAssignees[id + action.id]}
          setSelectedMember={(newAssignee) =>
            setSelectedAssignees((prev: any) => ({
              ...prev,
              [id + action.id]: newAssignee,
            }))
          }
          organizationId={organizationId}
          index={index}
          selectedDate={selectedDates[id + action.id]}
          setSelectedDate={(newDate: any) =>
            setSelectedDates((prev: any) => ({
              ...prev,
              [id + action.id]: newDate,
            }))
          }
          setShowDeleteModal={() => {}}
          UpdateAction={() => {
            if (action.retrospective !== 'empty') {
              updateBoardActionHandler(
                action.id,
                action.retrospective,
                selectedStatus[action.retrospective + action.id],
                descriptions[action.retrospective + action.id],
                selectedAssignees[action.retrospective + action.id],
                selectedDates[action.retrospective + action.id],
                action,
              );
            } else {
              UpdateAction(
                action,
                descriptions[action.team + action.id],
                selectedAssignees[action.team + action.id],
                selectedDates[action.team + action.id],
                action.archive,
                selectedStatus[action.team + action.id],
                '',
              );
            }
          }}
          isBoard={false}
          setEditCard={setEditCard}
          refetchTeamMembers={
            action.retrospective !== 'empty'
              ? searchMembers
              : refetchTeamMembers
          }
          loading={false}
          width={'w-full 2xl:w-[380px] tv:w-[350px] !mx-0'}
        />
      ) : (
        <Fragment>
          <Card
          organizationData={organization}
            setEditMode={() => {}}
            description={descriptions[id + action.id] || ''}
            teamMembers={
              action.retrospective !== 'empty' ? boardMembers : teamMembers
            }
            selectedMember={selectedAssignees[id + action.id]}
            setSelectedMember={(newAssignee) => {
              const retrospectiveId = action.retrospective;
              const actionId = action.id;

              setSelectedAssignees((prev: any) => {
                const newAssignees = { ...prev, [id + actionId]: newAssignee };

                if (action.retrospective !== 'empty') {
                  UpdateBoardAction(
                    action,
                    'member',
                    retrospectiveId,
                    newAssignee,
                  );
                } else {
                  UpdateAction(
                    action,
                    action.description,
                    newAssignee,
                    action.date,
                    action.archive,
                    action.status,
                    'member',
                  );
                }

                return newAssignees;
              });
            }}
            organizationId={organizationId}
            selectedDate={selectedDates[id + action.id]}
            setSelectedDate={(newDate: any) => {
              const retrospectiveId = action.retrospective;
              const actionId = action.id;

              setSelectedDates((prev: any) => {
                const newDates = { ...prev, [id + actionId]: newDate };

                if (action.retrospective !== 'empty') {
                  UpdateBoardAction(action, 'date', retrospectiveId, newDate);
                } else {
                  UpdateAction(
                    action,
                    action.description,
                    action.assignee,
                    newDate,
                    action.archive,
                    action.status,
                    'date',
                  );
                }

                return newDates;
              });
            }}
            setShowDeleteModal={() => handleShowDeleteModal(action.id)}
            ArchiveAction={() => {
              if (action.retrospective !== 'empty') {
                ArchiveBoardAction(
                  action.id,
                  action.retrospective,
                  !action.archive,
                );
              } else {
                ArchiveAction(action, !action.archive);
              }
            }}
            active={false}
            author={action.author}
            editCard={editCard}
            setEditCard={setEditCard}
            id={action.id}
            refetchTeamMembers={
              action.retrospective !== 'empty'
                ? searchMembers
                : refetchTeamMembers
            }
            loading={false}
            isAllowedToUpdate={isAllowedToUpdate}
            isAllowedToDelete={isAllowedToDelete}
            width={'w-full 2xl:w-[380px] tv:w-[350px] !mx-0'}
            isArchive={action.archive}
            isSearch={true}
            teamId={action.team}
            jiraUrl={action?.jiraURl}
          />
          <DeleteModal
            title="Delete action?"
            message="Are you sure you want to delete this action Item?"
            confirmMessage="Delete"
            cancelMessage="Cancel"
            showModal={showDeleteModal && deleteItemId === action.id}
            setShowModal={() => {
              setShowDeleteModal(false);
              setDeleteItemId('');
            }}
            confirmAction={() => {
              if (action.retrospective !== 'empty') {
                DeleteBoardAction(action.retrospective, action.id);
              } else {
                DeleteAction(action.id, action.team);
              }
              setDeleteItemId('');
            }}
            cancelAction={() => {
              setShowDeleteModal(false);
              setDeleteItemId('');
            }}
          />
        </Fragment>
      )}
    </div>
  );
}
