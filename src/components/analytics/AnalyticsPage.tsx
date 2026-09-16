import {
  useState,
  useEffect,
  useContext,
  Fragment,
  useCallback,
  useRef,
} from 'react';
import { useAuth } from 'reactfire';

import Image from 'next/image';
import Link from 'next/link';

import { BarChart } from '@tremor/react';

import { useCurrentOrganization } from '~/lib/organizations/hooks/use-current-organization';
import { useGetRetrospectives } from '~/lib/retrospectives/hooks/use-get-retrospectives';
import { useCurrentTeam } from '~/lib/organizations/hooks/use-current-team';
import { useUpdateOrganizationAIAnalytics } from '~/lib/organizations/hooks/use-update-ai-analytics';
import useFetchRules from '~/lib/server/rules/get-rules';

import { Restrictions } from '~/lib/entitlements/types';

import { SidebarContext } from '~/core/contexts/sidebar';
import If from '~/core/ui/If';

import dashboard from '/public/assets/svg/dashboard.svg';
import users from '/public/assets/svg/users.svg';
import action from '/public/assets/svg/clipboard-check.svg';
import brain from 'public/assets/svg/brain-circuit.svg';
import flag from '/public/assets/svg/flag.svg';

import LoadingMembersSpinner from '../organizations/LoadingMembersSpinner';
import DatePickerRange from '../shared/datepickerRange';
import WordCounterErrorModal from '../shared/wordCountErrorModal';

import RetrospectivesSidebar from './RetrospectivesSideBar';
import { useCurrentSubscriptionById } from '~/lib/entitlements/hooks/use-entitlements';
import RegenerateAiButton from '../shared/regenerateAiButton';
import AiNotConfiguredNotice from '../shared/AiNotConfiguredNotice';
import { useCurrentUserRole } from '~/lib/organizations/hooks/use-current-user-role';
import { MembershipRole } from '~/lib/organizations/types/membership-role';
import { useGetOrganizationById } from '~/lib/organizations/hooks/use-get-organization-by-id';
import SearchableDropdown from '../shared/searchableDropdown/searchableDropdown';
import { useFetchTeams } from '~/lib/server/teams/get-teams';
import useFetchTeamsById from '~/lib/server/teams/get-teams-id';
import { useUpdateTeamAiAnalytics } from '~/lib/teams/hooks/use-update-ai-analytics';
import { XCircleIcon } from '@heroicons/react/24/outline';
import useGetImprovementAreas from '~/lib/ai/use-get-improvement-areas';

export default function AnalyticsPage() {
  const [filterDate, setFilterDate] = useState('Filter by date');
  const [selectedMember, setFilterMember] = useState('Any member');

  const organizationData = useCurrentOrganization();
  const organizationId = organizationData?.id as string;

  const { organization } = useGetOrganizationById(organizationId);

  const { team } = useCurrentTeam();
  const teamId = team?.id as string;

  const auth = useAuth();
  const user = auth.currentUser;

  const [selectedTeam, setSelectedTeam] = useState<any>();

  const {
    fetchAllRetrospectives,
    fetchAIRetrospectives,
    totalRetrospectives,
    totalComments,
    totalActions,
    tagCount,
    enoughTags,
    loading,
    setFilters,
  } = useGetRetrospectives(organizationId, selectedTeam?.id, 15, 'all');

  const { data: rules } = useFetchRules('ai');

  const [canUseAI, setCanUseAI] = useState(false);

  useEffect(() => {
    if (rules) {
      setCanUseAI(rules.useAI);
    }
  }, [rules]);

  const [selectedAnalytics, setSelectedAnalytics] = useState(1);

  useEffect(() => {
    if (selectedAnalytics === 2) {
      if (selectedTeam && selectedTeam !== '') {
        setFilters({ teamBoards: true });
      } else {
        setFilters({ teamBoards: false });
      }
    } else {
      setFilters({ teamBoards: false });
    }
  }, [selectedTeam, selectedAnalytics]);

  return (
    <div
      className={
        'bg-gray-100 flex flex-col pb-36 flex flex-col flex-1 overflow-auto '
      }
    >
      <Header
        enoughTags={enoughTags}
        loading={loading}
        selectedAnalytics={selectedAnalytics}
        setSelectedAnalytics={setSelectedAnalytics}
      />

      {teamId && !user?.isAnonymous && user?.email ? (
        <Content
          setFilterMember={setFilterMember}
          selectedMember={selectedMember}
          setFilterDate={setFilterDate}
          filterDate={filterDate}
          totalRetrospectives={totalRetrospectives}
          totalComments={totalComments}
          fetchAllRetrospectives={fetchAllRetrospectives}
          totalActions={totalActions}
          tagCount={tagCount}
          loading={loading}
          fetchAIRetrospectives={fetchAIRetrospectives}
          organization={organization}
          canUseAI={canUseAI}
          rules={rules}
          user={user}
          enoughTags={enoughTags}
          selectedTeam={selectedTeam}
          setSelectedTeam={setSelectedTeam}
          selectedAnalytics={selectedAnalytics}
        />
      ) : (
        <div className="h-auto m-auto ">
          {!teamId ? (
            <p className="w-full text-2xl text-center m-auto">
              You need to be on a team to access Analytics
            </p>
          ) : (
            <p className="w-full text-2xl text-center m-auto">
              You need to be signed in to access Analytics
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Header({ loading, selectedAnalytics, setSelectedAnalytics }: any) {
  return (
    <div className="px-8 bg-white tv:px-36 pt-6 border-b border-[#E4E4E7] pb-5">
      <div className={`text-sm md:flex justify-between md:space-y-0`}>
        <h1 className="text-3xl font-semibold">Analytics</h1>
      </div>

      {loading ? (
        <div className="mt-5">
          <LoadingMembersSpinner />
        </div>
      ) : (
        <div className="flex items-center space-x-5 mt-5">
          <Image src={flag} alt="flag" />
          <p className="text-[#71717A] text-sm">
            This page displays an aggregate of all the comment tags from your
            retrospectives. Make sure to tag your comments to enable sentiment
            analysis of your team.
          </p>
        </div>
      )}

      <div className="flex text-sm justify-end px-8 tv:px-36 ">
        <div className="md:flex overflow-x-hidden flex-wrap text-zinc-400 bg-zinc-200 rounded-lg px-1.5 py-2 h-fit">
          <div
            className={`py-1 px-3 rounded-sm ${
              selectedAnalytics === 1 ? 'bg-white text-zinc-600' : ''
            } hover:bg-zinc-50 hover:text-zinc-500 transition cursor-pointer`}
            onClick={() => setSelectedAnalytics(1)}
          >
            <p>Organization Analytics</p>
          </div>
          <div
            className={`py-1 px-3 rounded-sm ${
              selectedAnalytics === 2 ? 'bg-white text-zinc-600' : ''
            } hover:bg-zinc-50 hover:text-zinc-500   transition cursor-pointer`}
            onClick={() => setSelectedAnalytics(2)}
          >
            <p>Team Analytics</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Content({
  loading,
  totalRetrospectives,
  fetchAllRetrospectives,
  totalComments,
  totalActions,
  tagCount,
  fetchAIRetrospectives,
  organization,
  canUseAI,
  user,
  rules,
  selectedTeam,
  setSelectedTeam,
  selectedAnalytics,
}: any) {
  const { collapsed } = useContext(SidebarContext);
  const [selectedTab, setSelectedTab] = useState(1);
  const [hasFilteredTab, setHasFilteredTab] = useState(false);

  const [dateRange, setDateRange] = useState<any>({
    startDate: undefined,
    endDate: undefined,
  });

  const handleValueChange = (newValue: any) => {
    setDateRange(newValue);
  };

  const [isDisabled, setIsDisabled] = useState(false);
  const [maximumRetrospectives, setMaximumRetrospectives] = useState(15);

  useEffect(() => {
    if (dateRange.startDate !== null && dateRange.endDate != null) {
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      setMaximumRetrospectives(15);
      fetchAllRetrospectives(15, startDate, endDate, selectedTeam?.id);
      setIsDisabled(true);
    } else if (dateRange.startDate === null && dateRange.endDate == null) {
      setMaximumRetrospectives(15);
      fetchAllRetrospectives(15, null, null, selectedTeam?.id);
      setIsDisabled(false);
    } else {
      fetchAllRetrospectives(15, null, null, selectedTeam?.id);
    }
  }, [dateRange, selectedTeam]);

  const {
    data,
    dropdownSearch,
    loadingSearch,
    loading: loadingTeams,
  } = useFetchTeams(organization?.id, user.uid, 10, '', '');

  useEffect(() => {
    if (data && data.length > 0) {
      setSelectedTeam(data[0]);
    }
  }, [data]);

  return (
    <div className="px-8 tv:px-36 pt-6 pb-36  bg-gray-100 md:px-16">
      <Fragment>
        <div
          className={`text-sm ${
            collapsed
              ? 'block space-y-5'
              : 'md:flex justify-between md:space-y-0 space-y-5'
          }`}
        >
          <div className="w-full md:flex md:space-x-2.5">
            <div className=" flex overflow-x-hidden flex-wrap  text-zinc-400  bg-zinc-200 rounded-lg px-1.5 py-2 ">
              <button
                className={`py-1 px-3 rounded-sm ${
                  selectedTab === 1 ? 'bg-white text-zinc-600' : ''
                } hover:bg-zinc-50 hover:text-zinc-500 transition cursor-pointer disabled:bg-zinc-50 disabled:blur-sm`}
                onClick={() => {
                  setSelectedTab(1);
                  setMaximumRetrospectives(15);
                  fetchAllRetrospectives(15, null, null, selectedTeam?.id);
                  setHasFilteredTab(true);
                }}
                disabled={isDisabled}
              >
                <p>Last 15 retrospective</p>
              </button>
              <button
                className={`py-1 px-3  rounded-sm ${
                  selectedTab === 2 ? 'bg-white text-zinc-600' : ''
                } hover:bg-zinc-50 hover:text-zinc-500 transition cursor-pointer disabled:bg-zinc-50 disabled:blur-sm`}
                onClick={() => {
                  setSelectedTab(2);
                  fetchAllRetrospectives(1, null, null, selectedTeam?.id);
                  setMaximumRetrospectives(1);
                  setHasFilteredTab(true);
                }}
                disabled={isDisabled}
              >
                <p>Last retrospective</p>
              </button>
            </div>
            <div className="my-2 md:my-auto  items-center">
              <p className="text-center text-orange-500 font-bold">OR</p>
            </div>
            <div className="relative w-auto my-auto">
              <div className="w-[330px]">
                <DatePickerRange
                  value={dateRange}
                  handleValueChange={handleValueChange}
                />
              </div>
            </div>

            <If condition={selectedAnalytics === 2}>
              <div className="md:w-auto m-auto">
                <SearchableDropdown
                  refetch={dropdownSearch}
                  label="name"
                  placeholder={'Type Team Name'}
                  options={data}
                  handleChange={setSelectedTeam}
                  selectedVal={selectedTeam}
                  loading={loadingSearch}
                />
              </div>
            </If>
          </div>
        </div>
        {!loading ? (
          <>
            <div className="grid md:grid-cols-3 gap-5 mt-[60px]">
              <div className="border bg-white rounded-md shadow-md p-6 ">
                <div className="text-sm flex justify-between">
                  <p>Restrospective</p>
                  <Image
                    className="w-6 h-6"
                    src={dashboard}
                    alt="dashboard"
                  ></Image>
                </div>
                <p className="mt-2 text-2xl font-bold">{totalRetrospectives}</p>
              </div>
              <div className="border bg-white rounded-md shadow-md p-6 ">
                <div className="text-sm flex justify-between">
                  <p>Comments</p>
                  <Image className="w-6 h-6" src={users} alt="users"></Image>
                </div>
                <p className="mt-2 text-2xl font-bold">{totalComments}</p>
              </div>
              <div className="border bg-white rounded-md shadow-md p-6 ">
                <div className="text-sm flex justify-between">
                  <p>Action Items</p>
                  <Image className="w-6 h-6" src={action} alt="action"></Image>
                </div>
                <p className="mt-2 text-2xl font-bold">{totalActions}</p>
              </div>
            </div>
            <div className="bg-white mt-6 border shadow-md p-6 rounded-md relative">
              <p className="font-semibold text-black">Top 10 Tags</p>
              <BarChart
                data={tagCount}
                index="name"
                categories={['total']}
                colors={['lime']}
                yAxisWidth={40}
                noDataText=""
              />
              {tagCount.length === 0 && (
                <p className="absolute top-1/2 mx-6 text-sm md:w-full text-center">
                  You are not seeing a chart because your comments do not have a
                  topic. <br></br>No worries, just go back and update your past
                  retrospectives to add tags to your team&apos;s comments.
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="h-full flex justify-center">
            <LoadingMembersSpinner />
          </div>
        )}
      </Fragment>

      <If condition={canUseAI}>
        <AIContent
          fetchAIRetrospectives={fetchAIRetrospectives}
          organization={organization}
          rules={rules}
          maximumRetrospectives={maximumRetrospectives}
          dateRange={dateRange}
          selectedAnalytics={selectedAnalytics}
          selectedTeam={selectedTeam}
          hasFilteredTab={hasFilteredTab}
          setHasFilteredTab={setHasFilteredTab}
        />
      </If>
    </div>
  );
}

function AIContent({
  fetchAIRetrospectives,
  organization,
  maximumRetrospectives,
  dateRange,
  rules,
  selectedAnalytics,
  selectedTeam,
  hasFilteredTab,
  setHasFilteredTab,
}: any) {
  const [aiData, setAIData] = useState<any[]>([]);
  const [analyzedRetrospectives, setAnalyzedRetrospecitves] = useState([]);

  const [loadingAI, setLoadingAI] = useState(false);
  const [hasDisplayedAI, setHasDisplayedAI] = useState(false);

  const [showSideBar, setShowSidebar] = useState(false);
  const [error, setError] = useState('');

  const [updateOrganizationAIAnalytics] = useUpdateOrganizationAIAnalytics();

  const [updateTeamAiAnalytics] = useUpdateTeamAiAnalytics();

  // This open-source build has no usage limits, so AI actions are never
  // rationed. Kept as a value rather than deleted so the (inert) prop chain
  // down to the board components stays intact.
  const aiRemaining = Number.POSITIVE_INFINITY;

  const [restrictions, setRestrictions] = useState<Restrictions>();

  const [showAiWordError, setShowAiWordError] = useState(false);

  const { product } = useCurrentSubscriptionById(
    organization?.subscription?.priceId,
    organization?.subscription?.status,
  );

  const currentUserRole = useCurrentUserRole();

  const aiCanceled = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: teamData } = useFetchTeamsById(
    organization?.id,
    selectedTeam?.id,
    1,
    '',
  );

  // Get Ai remaining
  useEffect(() => {
    setRestrictions(product);
  }, [product]);

  const [isFilterActivate, setIsFilterActivate] = useState(false);
  useEffect(() => {
    if (dateRange.startDate || hasFilteredTab) {
      setIsFilterActivate(true);
    } else {
      setIsFilterActivate(false);
    }
  }, [dateRange, hasFilteredTab]);

  const fetchAIBodyData = async () => {
    try {
      aiCanceled.current = false;
      setLoadingAI(true);
      let startDate;
      let endDate;
      if (dateRange.startDate !== null && dateRange.endDate != null) {
        startDate = new Date(dateRange.startDate);
        endDate = new Date(dateRange.endDate);
      }

      // Set a timeout to cancel the AI action after 5 minutes (300000 ms)
      timeoutRef.current = setTimeout(() => {
        aiCanceled.current = true;
        setLoadingAI(false);
        console.error('AI action timed out');
      }, 300000);

      const aiBody = await fetchAIRetrospectives(
        maximumRetrospectives,
        startDate,
        endDate,
        selectedAnalytics === 1 ? '' : selectedTeam?.id,
      );

      if (aiCanceled.current) return;

      if (aiBody) {
        const retrospectiveanalyzed = aiBody.map((retro: any) => ({
          id: retro.id,
          name: retro.name,
        }));
        setAnalyzedRetrospecitves(retrospectiveanalyzed);
        if (aiBody.length > 0) {
          setError('');
          getImprovementAreasProjectManager(aiBody, retrospectiveanalyzed);
        } else {
          setLoadingAI(false);
          setError("You don't have enough retrospectives to analyze");
        }
      }
    } catch (error) {
      setLoadingAI(false);
      console.error('Error fetching data:', error);
    } finally {
      // Clear the timeout if the request completes before the timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  };

  useEffect(() => {
    // Reset AI data display state when selectedAnalytics changes
    setHasDisplayedAI(false);
  }, [selectedAnalytics, teamData]);

  useEffect(() => {
    if (!hasDisplayedAI) {
      const shouldFetchData =
        aiRemaining > 0 &&
        currentUserRole === MembershipRole.Admin &&
        !hasDisplayedAI;

      if (selectedAnalytics === 1) {
        if (organization?.aiAnalytics) {
          setAIData(organization?.aiAnalytics);
          setAnalyzedRetrospecitves(organization?.aiAnalyzedRetrospectives);
          setHasDisplayedAI(true);
        } else if (shouldFetchData) {
          fetchAIBodyData();
        }
      } else {
        if (teamData?.aiAnalytics) {
          setAIData(teamData?.aiAnalytics);
          setAnalyzedRetrospecitves(teamData?.aiAnalyzedRetrospectives);
          setHasDisplayedAI(true);
        } else if (shouldFetchData) {
          fetchAIBodyData();
        }
      }
    }
  }, [
    hasDisplayedAI,
    aiRemaining,
    currentUserRole,
    organization,
    selectedAnalytics,
    teamData,
  ]);

  const { trigger: getImprovementAreasProjectManagerAI } =
    useGetImprovementAreas();

  const getImprovementAreasProjectManager = useCallback(
    async (retrospectives: any, analyzedRetrospectives: any) => {

      try {
        const response = await getImprovementAreasProjectManagerAI({
          retrospectives: retrospectives,
          totalAiTokens: rules.totalAiTokens,
        }) as any;
    
        if (aiCanceled.current) return;

        if (response.success) {
          setAIData(response.data);
          setLoadingAI(false);
          setHasDisplayedAI(true);

          // Save Ai analytics for organization

          if (selectedAnalytics === 1) {
            updateOrganizationAIAnalytics(
              organization?.id,
              response.data,
              analyzedRetrospectives,
            ).then(() => {
              setIsFilterActivate(false);
              setHasFilteredTab(false);
            });
          } // Save Ai analytics for teams
          else {
            updateTeamAiAnalytics(
              organization?.id,
              selectedTeam?.id,
              response.data,
              analyzedRetrospectives,
            );
          }
        } else {
          console.error(response.data);
          setLoadingAI(false);
          setHasDisplayedAI(true);
          if (response.error) {
            setShowAiWordError(true);
          }
          throw new Error('Response contains invalid key "Ownership"');
        }
      } catch (error) {
        console.error(error);
        // Handle error as needed
      } finally {
        // Clear the timeout if the request completes before the timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      }
    },
    [
      getImprovementAreasProjectManagerAI,
      aiRemaining,
      organization?.id,
      updateOrganizationAIAnalytics,
      updateTeamAiAnalytics,
      rules,
      selectedAnalytics,
      selectedTeam,
      setHasFilteredTab,
    ],
  );

  const onCancelAI = () => {
    setLoadingAI(false);
    aiCanceled.current = true;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  return (
    <div className={`bg-white p-2.5 mt-6 min-h-[300px]`}>
      <WordCounterErrorModal
        showModal={showAiWordError}
        message={
          'This data is too large for our AI to Analyze, please select a smaller range of dates'
        }
        setShowModal={setShowAiWordError}
      />
      {showSideBar && (
        <div className="fixed top-0 left-0 w-full h-full bg-black opacity-20 z-10 pointer-events-auto "></div>
      )}
      <div className="space-y-1">
        <p className="text-2xl font-semibold">Ai Insights</p>
        <p className="text-[#71717A] text-sm">
          Here are the {analyzedRetrospectives?.length} <b>retrospectives</b> we
          have <b>analyzed</b>.
          <br />
          {analyzedRetrospectives
            .slice(0, 5)
            .map((item: any, index: number) => (
              <Link href={`/board/${item.id}`} key={'analyzed' + index}>
                <span className="font-bold text-blue-500 underline">
                  {item.name}
                </span>
                <span className="font-normal text-[#71717A]">,&nbsp;</span>
              </Link>
            ))}
          {analyzedRetrospectives.length > 5 && (
            <button onClick={() => setShowSidebar(true)} className="underline">
              more...
            </button>
          )}
        </p>
      </div>
      <div className="mt-8">
        <div className="md:w-full md:flex md:space-x-2.5 space-y-2 md:space-y-0">
          <div className="flex overflow-x-hidden flex-wrap text-sm text-zinc-400 bg-zinc-200 rounded-lg px-1.5 py-2">
            <div
              className={`py-1 px-3 bg-white rounded-sm transition cursor-pointer`}
            >
              <p>Project Manager</p>
            </div>
          </div>
        </div>
        <div className={`mt-6 relative`}>
          <If condition={currentUserRole === MembershipRole.Admin}>
            {isFilterActivate && (
              <Fragment>
                <div className="absolute z-10  inset-0 ">
                  <div className="flex justify-center h-full items-center">
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setIsFilterActivate(false);
                          setHasFilteredTab(false);
                        }}
                        className="w-full justify-end flex"
                      >
                        <XCircleIcon width={30} />
                      </button>

                      <p className="text-sm text-center font-bold text-red-500">
                        {' '}
                        Click Regenerate to analyze updated filtered or selected
                        range
                      </p>

                      <AiNotConfiguredNotice className={'mb-4'} />

                      <div className="flex justify-center">
                        <RegenerateAiButton onAction={fetchAIBodyData} />
                      </div>
                      {loadingAI && (
                        <Fragment>
                          <div className="flex justify-center space-x-5 items-center">
                            <LoadingMembersSpinner />
                          </div>
                          <div className="flex justify-center">
                            <button
                              onClick={onCancelAI}
                              className="px-4 py-2 mt-4 bg-[#EF4444] text-white rounded hover:bg-red-600 focus:outline-none"
                            >
                              Cancel
                            </button>
                          </div>
                        </Fragment>
                      )}
                      <p className="text-center text-sm text-[#71717A]">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-0"></div>
              </Fragment>
            )}
          </If>
          <div className="flex w-full h-full space-x-6">
            <div className="w-[70px] md:w-[30px]">
              <Image className="w-full h-[31px]" src={brain} alt="brain" />
            </div>
            <div>

           {(loadingAI && !isFilterActivate ) ? <LoadingMembersSpinner/>
           :    <Fragment>
              {Array.isArray(aiData) && aiData.length > 0 ? (
                aiData.map((section, index) => (
                  <div className="space-y-4" key={index}>
                    {Object.entries(section).map(
                      ([title, details], subIndex) => (
                        <div className="text-sm text-[#71717A]" key={subIndex}>
                          <p className="text-orange-500 font-semibold mb-2">
                            {title}
                          </p>
                          <ul className="space-y-2">
                            {Object.entries(details as any).map(
                              ([key, value], detailIndex) => (
                                <li key={detailIndex}>
                                  <div className="md:flex">
                                    <p className="md:w-64">
                                      <b>{key}</b>
                                    </p>
                                    <p className="w-full">{value as any}</p>
                                  </div>
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                      ),
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#71717A]">{error}</p>
              )}
              </Fragment>}
             
            </div>
          </div>
        </div>
      </div>
      {showSideBar && (
        <RetrospectivesSidebar
          organizationId={organization}
          setShowSidebar={setShowSidebar}
          analyzedRetrospectives={analyzedRetrospectives}
        />
      )}
    </div>
  );
}
