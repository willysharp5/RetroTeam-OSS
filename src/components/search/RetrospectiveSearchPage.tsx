import { useState, useEffect, useCallback, Fragment } from 'react';
import { useAuth } from 'reactfire';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '~/core/ui/Select';

import FilterBox from '../shared/filterbox';
import DatePickerRange from '../shared/datepickerRange';

import useFetchRules from '~/lib/server/rules/get-rules';

import { useCurrentOrganization } from '~/lib/organizations/hooks/use-current-organization';
import { useCurrentTeam } from '~/lib/organizations/hooks/use-current-team';


import { useDeleteRetrospective } from '~/lib/retrospectives/hooks/use-delete-retrospective-by-id';
import { usePatchRetrospective } from '~/lib/retrospectives/hooks/use-patch-retrospective-by-id';
import { Retrospectives } from '~/lib/retrospectives/types/retrospectives';

import { useFetchTeams } from '~/lib/server/teams/get-teams';

import useSearchRetrospectivesCreators from '~/lib/server/search/use-search-creators';
import useSearchRetrospectives from '~/lib/server/search/use-search-retrospectives';

import RetrospectiveCard from '../retrospectives/retrospectivecard/RetrospectiveCard';
import LoadingMembersSpinner from '../organizations/LoadingMembersSpinner';
import PaginationController from '../shared/paginationController';
import If from '~/core/ui/If';

const DEFAULT_ROWS = 10;

export default function RetrospectiveSearchPage() {
  const organization = useCurrentOrganization();
  const organizationId = organization?.id as string;

  const auth = useAuth();
  const currentUser = auth.currentUser;
  const userId = currentUser?.uid as string;

  const { team } = useCurrentTeam();
  const teamId = team?.id as string;

  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [dateRange, setDateRange] = useState<any>({
    startDate: undefined,
    endDate: undefined,
  });

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>([]);

  const [teams, setTeams] = useState<any>([]);

  const [selectedTeams, setSelectedTeams] = useState([]);
  const [selectedBoards, setSelectedBoards] = useState([]);
  const [selectedCreators, setSelectedCreators] = useState([]);

  const { trigger: search } = useSearchRetrospectives();

  const [teamName, setTeamName] = useState('');

  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const onSearch = useCallback(async () => {
    setLoading(true);
    const selectedTeamIds = selectedTeams.map((team: any) => team.id);
    const selectedUsersIds = selectedCreators.map(
      (user: any) => user.document.userId,
    );
    const body = {
      query: name,
      typeFilter: type,
      organizationFilter: organizationId,
      teamFilter: selectedTeamIds,
      selectedBoards: selectedBoards,
      selectedUsersIds: selectedUsersIds,
      startDate: dateRange?.startDate
        ? new Date(dateRange.startDate).getTime()
        : undefined,
      endDate: dateRange?.endDate
        ? new Date(dateRange.endDate).getTime()
        : undefined,
      userId,
      teamId,
      rowsPerPage: rowsPerPage,
      currentPage: currentPage,
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
  }, [
    search,
    name,
    type,
    organizationId,
    selectedTeams,
    selectedBoards,
    selectedCreators,
    userId,
    teamId,
    dateRange,
    rowsPerPage,
    currentPage,
  ]);

  useEffect(() => {
    if (teamId && userId) {
      onSearch();
    }
  }, [
    name,
    type,
    organizationId,
    selectedTeams,
    selectedBoards,
    selectedCreators,
    userId,
    teamId,
    dateRange,
    rowsPerPage,
    currentPage,
  ]);

  const {
    data: teamsData,
    loadingSearch,
    loading: loadingTeamsData,
    totalTeams,
  } = useFetchTeams(organizationId, userId, 5, teamName, '');

  const loadingTeams = loadingSearch || loadingTeamsData;

  useEffect(() => {
    if (teamsData) setTeams(teamsData);
  }, [teamsData]);

  return (
    <>
      <div
        className={`flex flex-col pb-36 flex flex-col flex-1 md:overflow-x-hidden overflow-y-auto ${
          (!currentUser?.email || currentUser?.isAnonymous) && 'bg-gray-100'
        }`}
      >
        <Header
          name={name}
          setName={setName}
          type={type}
          setType={setType}
          dateRange={dateRange}
          setDateRange={setDateRange}
          currentUser={currentUser}
        />
        <If condition={!currentUser?.isAnonymous && currentUser?.email}>
          <Content
            results={results}
            loading={loading}
            organizationId={organizationId}
            totalTeams={totalTeams}
            teams={teams}
            loadingTeams={loadingTeams}
            userId={userId}
            teamName={teamName}
            setTeamName={setTeamName}
            selectedTeams={selectedTeams}
            setSelectedTeams={setSelectedTeams}
            selectedBoards={selectedBoards}
            setSelectedBoards={setSelectedBoards}
            selectedCreators={selectedCreators}
            setSelectedCreators={setSelectedCreators}
            onSearch={onSearch}
            rowsPerPage={rowsPerPage}
            setRowsPerPage={setRowsPerPage}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
            isAnonymous={currentUser?.isAnonymous || !currentUser?.email}
          />
        </If>
      </div>{' '}
    </>
  );
}

function Header({
  name,
  setName,
  type,
  setType,
  dateRange,
  setDateRange,
  currentUser,
}: any) {
  const currentPath = usePathname() ?? '';

  const handleValueChange = (newValue: any) => {
    setDateRange(newValue);
  };

  return (
    <Fragment>
      <div className="px-4 md:px-2 2xl:px-16 py-6 tv:px-16  pt-12 bg-white space-y-5 pb-5 w-full">
        <div
          className={`text-sm md:flex justify-between md:space-y-0 space-y-2`}
        >
          <h1 className="text-2xl text-center md:text-3xl font-semibold">
            Search - Retrospectives
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
              className="md:w-[743px] w-full rounded-md border py-4 px-2"
              placeholder="Search by Retrospective Name"
            />
            <div className="md:w-[177px]">
              <Select
                value={type === '' ? 'all' : type}
                onValueChange={(value) => setType(value === 'all' ? '' : value)}
              >
                <SelectTrigger data-cy={'role-selector-trigger'}>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem key={'all'} data-cy={'filter-access'} value="all">
                    <p>All</p>
                  </SelectItem>
                  <SelectItem
                    key={'private'}
                    data-cy={'filter-access'}
                    value={'private'}
                  >
                    <p>Private</p>
                  </SelectItem>
                  <SelectItem
                    key={'public'}
                    data-cy={'filter-access'}
                    value={'public'}
                  >
                    <p>Public</p>
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
      <If condition={currentUser?.isAnonymous || !currentUser?.email}>
        <div className="px-16 py-6 tv:px-36 flex flex-col flex-1 overflow-auto pt-6 space-y-5 pb-5 w-full border-t border-[#E4E4E7] items-center">
          <p className="w-full text-2xl text-center  font-smeibold text-center m-auto">
            You need to be signed in to access the Search Page
          </p>
        </div>
      </If>
    </Fragment>
  );
}

function Content({
  results,
  loading,
  organizationId,
  totalTeams,
  userId,
  teams,
  loadingTeams,
  teamName,
  setTeamName,
  setSelectedTeams,
  selectedTeams,
  setSelectedBoards,
  selectedBoards,
  selectedCreators,
  setSelectedCreators,
  onSearch,
  rowsPerPage,
  setRowsPerPage,
  currentPage,
  setCurrentPage,
  totalPages,
  isAnonymous,
}: any) {
  const { data: rules } = useFetchRules('retrospectives');

  const { deleteRetrospective } = useDeleteRetrospective(organizationId);

  const { patchRetrospective } = usePatchRetrospective(organizationId);

  function onPatchRetrospective(data: Partial<Retrospectives>) {
    patchRetrospective(data).then(() => {
      setTimeout(() => {
        onSearch();
      }, 2000);
    });
  }

  function onDeleteRetrospective(id: string) {
    deleteRetrospective(id).then(() => {
      setTimeout(() => {
        onSearch();
      }, 3000);
    });
  }

  const { trigger: searchCreators } = useSearchRetrospectivesCreators();

  const [name, setName] = useState('');
  const [boardName, setBoardName] = useState('');

  const boardFilters = [
    {
      name: 'My Boards',
      id: 'myboards',
    },
    {
      name: 'Shared Boards',
      id: 'shared',
    },
    {
      name: 'Team Boards',
      id: 'team',
    },
    {
      name: 'Archives',
      id: 'archives',
    },
  ];

  const [boardOptions, setBoardOptions] = useState(boardFilters);

  useEffect(() => {
    if (boardName) {
      const filtered = boardFilters.filter((board) =>
        board.name.toLowerCase().includes(boardName.toLowerCase()),
      );
      setBoardOptions(filtered);
    } else {
      setBoardOptions(boardFilters);
    }
  }, [boardName]);

  const [creators, setCreators] = useState<any>([]);
  const [loadingCreators, setLoadingCreators] = useState(false);

  const [creatorsRowsPerPage, setCreatorsRowsPerPage] = useState(4);
  const [creatorsCurrentPage, setCreatorsCurrentPage] = useState(1);
  const [creatorsTotalPages, setCreatorsTotalPages] = useState(0);

  const handleCreatorsPage = (page: number) => {
    setCreatorsCurrentPage(page);
  };

  const onSearchCreators = useCallback(async () => {
    setLoadingCreators(true);
    const body = {
      query: name,
      organizationFilter: organizationId,
      rowsPerPage: creatorsRowsPerPage,
      currentPage: creatorsCurrentPage,
    };
    searchCreators(body)
      .then((res: any) => {
        const results = res.hits;
        setCreatorsCurrentPage(res.page);
        const totalPages = Math.ceil(res.found / creatorsRowsPerPage);
        setCreatorsTotalPages(totalPages);
        setCreators(results);
        setLoadingCreators(false);
      })
      .catch((e) => {
        console.error('ERROR onSearchCreators', e);
        setLoadingCreators(false);
      });
  }, [
    searchCreators,
    name,
    organizationId,
    creatorsRowsPerPage,
    creatorsCurrentPage,
  ]);

  useEffect(() => {
    onSearchCreators();
  }, [name, creatorsRowsPerPage, creatorsCurrentPage]);

  const handleResultsPage = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="py-6 px-4 md:px-2 2xl:px-16 relative">
      <div className="md:flex justify-between gap-x-6 w-full">
        <div className="space-y-6 md:w-1/4">
          <FilterBox
            name={name}
            setName={setName}
            data={creators}
            placeholder={'Creators'}
            setSelectedValues={setSelectedCreators}
            selectedValues={selectedCreators}
            numberAccessKey={'document.retrospectivesCount'}
            nameAccessKey={'document.fullName'}
            loading={loadingCreators}
            pagination={true}
            rowsPerPage={creatorsRowsPerPage}
            setRowsPerPage={setCreatorsRowsPerPage}
            totalPages={creatorsTotalPages}
            currentPage={creatorsCurrentPage}
            refetch={handleCreatorsPage}
            hasLimit={250}
          />
          <FilterBox
            name={teamName}
            setName={setTeamName}
            data={teams}
            placeholder={'Teams'}
            setSelectedValues={setSelectedTeams}
            selectedValues={selectedTeams}
            numberAccessKey={'retrospectivesCount'}
            loading={loadingTeams}
          />
          <FilterBox
            name={boardName}
            setName={setBoardName}
            data={boardOptions}
            placeholder={'Boards'}
            setSelectedValues={setSelectedBoards}
            selectedValues={selectedBoards}
            loading={false}
          />
        </div>
        <div className="h-fit md:w-3/4 w-full">
          <div className="md:bg-gray-100 mt-4 md:mt-0 md:p-4  ">
            {!loading ? (
              <div className="grid md:grid-cols-2 gap-4">
                {results &&
                  results?.map((item: any) => {
                    const retrospective = item.document;
                    const members = JSON.parse(retrospective.members);
                    let isFacilitator = false;
                    const currentUser = members[userId as any];
                    if (currentUser) {
                      isFacilitator = currentUser.role > 0;
                    } else {
                      isFacilitator = false;
                    }
                    return (
                      <div
                        key={'retrospective-card' + retrospective.id}
                        className="h-auto md:w-full"
                      >
                        <RetrospectiveCard
                          key={retrospective.id}
                          open={!retrospective.finished}
                          title={retrospective.title}
                          name={retrospective.name}
                          date={new Date(retrospective.date)}
                          isPublic={retrospective.type === 'public'}
                          id={retrospective.id}
                          isArchived={retrospective.archived}
                          onDelete={() => {
                            onDeleteRetrospective(retrospective.id);
                          }}
                          onPatch={onPatchRetrospective}
                          rules={rules}
                          userId={userId}
                          isAnonymous={isAnonymous}
                          isFacilitator={isFacilitator}
                          submit={onSearch}
                          totalTeams={totalTeams}
                        />
                      </div>
                    );
                  })}
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
