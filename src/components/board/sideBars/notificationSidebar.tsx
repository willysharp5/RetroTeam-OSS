import Image from 'next/image';

import { useCallback, useEffect, useState } from 'react';
import toaster, { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import Sidebar from '~/core/ui/SideBarComponent';

import x from 'public/assets/svg/x.svg';
import badgeX from 'public/assets/svg/badge-x.svg';
import badgeCheck from 'public/assets/svg/badge-check.svg';
import trash from 'public/assets/svg/trash.svg';
import checkCircled from 'public/assets/svg/check-circle.svg';
import dashboardIcon from 'public/assets/svg/dashboard.svg';
import users from 'public/assets/svg/users.svg';
import checkmark from 'public/assets/images/check.png';

import { useFetchTeamNotification } from '~/lib/server/notifications/use-fetch-team-notification';
import { useFetchBoardNotificationInvites } from '~/lib/server/notifications/use-fetch-board-notification-invites';
import { useFetchActionsNotifications } from '~/lib/server/notifications/use-fetch-actions-notifications';
import { useFetchTodayNotification } from '~/lib/server/notifications/use-fetch-today-notifications';
import { useFetchLastWeekNotifications } from '~/lib/server/notifications/use-fetch-last-week-';
import { useFetchLastMonthNotifications } from '~/lib/server/notifications/use-fetch-last-month';
import { useFetchLastYearNotifications } from '~/lib/server/notifications/use-fetch-last-year';

import { Notification } from '~/lib/notifications/types/types';

import useDeleteNotification from '~/lib/notifications/hooks/use-delete-notification';
import useDeleteAllNotificationByType from '~/lib/notifications/hooks/use-delete-all-notifications';
import useDeleteAllNotificationByDate from '~/lib/notifications/hooks/use-delete-all-notifications-by-date';


import useAddMemberToOrganizationTeam from '~/lib/teams/hooks/use-add-member-to-organization-team';
import useAddMemberToBoard from '~/lib/board/hooks/use-add-member-to-board';

import { getDateStatus } from '~/components/utils/dateformatter';
import LoadingMembersSpinner from '~/components/organizations/LoadingMembersSpinner';
import PaginationController from '~/components/shared/paginationController';
import DeleteModal from '~/components/shared/deleteModal';

import If from '~/core/ui/If';
import { useUserSession } from '~/core/hooks/use-user-session';
import { useFetchRestYearNotifications } from '~/lib/server/notifications/use-fetch-rest-years';
import { useFetchCurrentYearNotifications } from '~/lib/server/notifications/use-fetch-current-year';
import { useFetchThisWeekNotifications } from '~/lib/server/notifications/use-fetch-this-week';

import { Tooltip, TooltipContent, TooltipTrigger } from '~/core/ui/Tooltip';
import { useRouter } from 'next/router';
import { useUpdateNotificationById } from '~/lib/notifications/hooks/use-update-notification-by-id';
import { useUpdateNotifications } from '~/lib/notifications/hooks/use-update-notification';

const DEFAULT_ROWS = 2;

export default function NotificationSidebar({
  setShowSidebar,
  organizationId,
  currentUser,
}: any) {
  const [selectedTab, setSelectedTab] = useState(2);

  const userData = useUserSession();

  return (
    <Sidebar>
      <div className="w-full md:w-[600px] z-50 bg-white h-full shadow-md border-l fixed top-0 right-0 overflow-y-auto">
        <div className="sticky top-0 bg-white z-20 p-6 pb-6">
          <div className="bg-white print:hidden flex justify-between">
            <p className="text-sm font-black">Notifications</p>
            <Image
              className="h-6 w-6 cursor-pointer"
              src={x}
              alt="x"
              onClick={() => setShowSidebar(false)}
            ></Image>
          </div>
          <div className="mt-4 text-sm flex flex-col justify-center space-y-2">
            <div className="flex">
              <div className="flex overflow-x-hidden flex-wrap text-zinc-400 bg-zinc-100 rounded-lg px-1.5 py-2">
                <div
                  className={`py-1 px-3 rounded-sm ${
                    selectedTab === 1 ? 'bg-white text-zinc-600' : ''
                  } hover:bg-zinc-50 hover:text-zinc-500 transition cursor-pointer`}
                  onClick={() => setSelectedTab(1)}
                >
                  <p>By Type</p>
                </div>
                <div
                  className={`py-1 px-3 rounded-sm ${
                    selectedTab === 2 ? 'bg-white text-zinc-600' : ''
                  } hover:bg-zinc-50 hover:text-zinc-500 transition cursor-pointer`}
                  onClick={() => setSelectedTab(2)}
                >
                  <p>By Date</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 pt-0">
          {selectedTab === 1 ? (
            <ByType
              organizationId={organizationId}
              currentUser={currentUser}
              userData={userData?.data}
            />
          ) : (
            <ByDate
              organizationId={organizationId}
              currentUser={currentUser}
              userData={userData?.data}
            />
          )}
        </div>
      </div>
    </Sidebar>
  );
}

const ByType = ({ organizationId, currentUser, userData }: any) => {
  const [teamsRowsPerPage, setTeamsRowsPerPage] = useState(DEFAULT_ROWS);
  const [boardsRowsPerPage, setBoardsRowsPerPage] = useState(DEFAULT_ROWS);
  const [actionsRowsPerPage, setActionsRowsPerPage] = useState(DEFAULT_ROWS);

  const [teamNotifications, setTeamNotifications] = useState([]);
  const [boardNotifications, setBoardNotifications] = useState([]);
  const [actionNotifications, setActionNotifications] = useState([]);

  const {
    data: teamData,
    refetch: refetchTeamNotifications,
    currentPage: currentTeamPage,
    totalPages: totalTeamPages,
    loading: loadingTeamNotifications,
  } = useFetchTeamNotification(
    organizationId,
    teamsRowsPerPage,
    currentUser.email,
  );

  useEffect(() => {
    setTeamNotifications(teamData);
  }, [teamData]);

  const {
    data: boardsData,
    refetch: refetchBoardNotifications,
    currentPage: currentBoardPage,
    totalPages: totalBoardPages,
    loading: loadingBoardNotifications,
  } = useFetchBoardNotificationInvites(
    organizationId,
    boardsRowsPerPage,
    currentUser.email,
  );

  useEffect(() => {
    setBoardNotifications(boardsData);
  }, [boardsData]);

  const {
    data: actionsData,
    refetch: refetchActionsNotifications,
    currentPage: currentActionPage,
    totalPages: totalActionPages,
    loading: loadingActionsNotifications,
  } = useFetchActionsNotifications(
    organizationId,
    actionsRowsPerPage,
    currentUser.email,
  );

  useEffect(() => {
    setActionNotifications(actionsData);
  }, [actionsData]);

  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

  const [section, setSection] = useState('');

  const clearAllHandler = (section: any) => {
    setShowDeleteAllModal(true);
    setSection(section);
  };

  const { trigger: deleteAllByType } = useDeleteAllNotificationByType();

  const clearAllAction = () => {
    const body = {
      organizationId: organizationId,
      email: currentUser.email,
      type: section,
    };

    const promise = deleteAllByType(body)
      .then((res: any) => {
        if (res.success === true) {
          setShowDeleteAllModal(false);
          setSection('');
        }
      })
      .catch((e) => {
        console.log('ERROR clearAllAction', e);
      });
    toast.promise(promise, {
      loading: 'Clearing notifications',
      success: 'Notification removed',
      error: 'Error on removing notification',
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-100 p-2">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2 items-center">
            <Image className="h-4 w-4" src={users} alt="users" />
            <p className="font-semibold text-base">Teams</p>
          </div>
          <If condition={teamNotifications?.length > 0}>
            <button
              onClick={() => clearAllHandler('team')}
              className="flex bg-white items-center px-4 py-2 rounded-md hover:bg-gray-50 space-x-2"
            >
              <p>Clear All</p>
              <Image src={badgeX} alt="badgeX"></Image>
            </button>
          </If>
        </div>
        <div className="space-y-6 mt-4">
          {loadingTeamNotifications ? (
            <div className="m-auto w-full flex justify-center">
              <LoadingMembersSpinner />
            </div>
          ) : (
            <>
              {teamNotifications?.length > 0 ? (
                teamNotifications.map((item: Notification, index: number) => (
                  <Card
                    key={'teamNotifications ' + index}
                    notificaiton={item}
                    organizationId={organizationId}
                    refetch={refetchTeamNotifications}
                    section={'team'}
                    userData={userData}
                  />
                ))
              ) : (
                <div className="bg-white text-xs w-full border py-4 px-6 rounded-md space-y-1">
                  <p>You don&apos;t have team notifications</p>
                </div>
              )}
            </>
          )}
          <div className="mt-6">
            <PaginationController
              rowsPerPage={teamsRowsPerPage}
              setRowsPerPage={setTeamsRowsPerPage}
              totalPages={totalTeamPages}
              currentPage={currentTeamPage}
              refetch={refetchTeamNotifications}
            />
          </div>
        </div>
      </div>
      <div className="bg-gray-100 p-2">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2 items-center">
            <Image
              className="h-4 w-4"
              src={dashboardIcon}
              alt="dashboardIcon"
            />
            <p className="font-semibold text-base">Boards</p>
          </div>
          <If condition={boardNotifications?.length > 0}>
            <button
              onClick={() => clearAllHandler('board')}
              className="flex bg-white items-center px-4 py-2 rounded-md hover:bg-gray-50 space-x-2"
            >
              <p>Clear All</p>
              <Image src={badgeX} alt="badgeX"></Image>
            </button>
          </If>
        </div>
        <div className="space-y-6 mt-4">
          {loadingBoardNotifications ? (
            <div className="m-auto w-full flex justify-center">
              <LoadingMembersSpinner />
            </div>
          ) : (
            <>
              {boardNotifications?.length > 0 ? (
                boardNotifications.map((item: Notification, index: number) => (
                  <Card
                    key={'boardNotifications ' + index}
                    notificaiton={item}
                    organizationId={organizationId}
                    refetch={refetchBoardNotifications}
                    userData={userData}
                  />
                ))
              ) : (
                <div className="bg-white text-xs w-full border py-4 px-6 rounded-md space-y-1">
                  <p>You don&apos;t have board notifications</p>
                </div>
              )}
              <div className="mt-6">
                <PaginationController
                  rowsPerPage={boardsRowsPerPage}
                  setRowsPerPage={setBoardsRowsPerPage}
                  totalPages={totalBoardPages}
                  currentPage={currentBoardPage}
                  refetch={refetchBoardNotifications}
                />
              </div>
            </>
          )}
        </div>
      </div>
      <div className="bg-gray-100 p-2">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2 items-center">
            <Image className="h-4 w-4" src={checkCircled} alt="checkCircled" />
            <p className="font-semibold text-base">Actions</p>
          </div>
          <If condition={actionNotifications?.length > 0}>
            <button
              onClick={() => clearAllHandler('actions')}
              className="flex bg-white items-center px-4 py-2 rounded-md hover:bg-gray-50 space-x-2"
            >
              <p>Clear All</p>
              <Image src={badgeX} alt="badgeX"></Image>
            </button>
          </If>
        </div>

        <div className="space-y-6 mt-4">
          {loadingActionsNotifications ? (
            <div className="m-auto w-full flex justify-center">
              <LoadingMembersSpinner />
            </div>
          ) : (
            <>
              {actionNotifications?.length > 0 ? (
                actionNotifications.map((item: Notification, index: number) => {
                  return (
                    <Card
                      key={'actionsNotifications ' + index}
                      notificaiton={item}
                      organizationId={organizationId}
                      refetch={refetchActionsNotifications}
                      userData={userData}
                    />
                  );
                })
              ) : (
                <div className="bg-white text-xs w-full border py-4 px-6 rounded-md space-y-1">
                  <p>You don&apos;t have action notifications</p>
                </div>
              )}
              <div className="mt-6">
                <PaginationController
                  rowsPerPage={actionsRowsPerPage}
                  setRowsPerPage={setActionsRowsPerPage}
                  totalPages={totalActionPages}
                  currentPage={currentActionPage}
                  refetch={refetchActionsNotifications}
                />
              </div>
            </>
          )}
        </div>
      </div>
      <DeleteModal
        message="Are you sure you want to delete all notifications?"
        showModal={showDeleteAllModal}
        setShowModal={setShowDeleteAllModal}
        confirmAction={clearAllAction}
      ></DeleteModal>
    </div>
  );
};

const ByDate = ({ organizationId, currentUser, userData }: any) => {
  const [todaysRowsPerPage, setTodaysRowsPerPage] = useState(DEFAULT_ROWS);
  const [thisWeekRowsPerPage, setThisWeekRowsPerPage] = useState(DEFAULT_ROWS);
  const [lastWeekRowsPerPage, setLastWeekRowsPerPage] = useState(DEFAULT_ROWS);
  const [lastMonthRowsPerPage, setLastMonthRowsPerPage] =
    useState(DEFAULT_ROWS);
  const [currentYearRowsPerPage, setCurrentYearRowsPerPage] =
    useState(DEFAULT_ROWS);
  const [lastYearRowsPerPage, setLastYearRowsPerPage] = useState(DEFAULT_ROWS);
  const [restYearRowsPerPage, setRestYearRowsPerPage] = useState(DEFAULT_ROWS);

  const [todayNotifications, setTodaysNotifications] = useState([]);
  const [thisWeekNotifications, setThisWeekNotifications] = useState([]);
  const [lastWeekNotifications, setLastWeekNotifications] = useState([]);
  const [lastMonthNotifications, setLastMonthNotifications] = useState([]);
  const [currentYearNotifications, setCurrentYearNotifications] = useState([]);
  const [lastYearNotifications, setLastYearNotifications] = useState([]);
  const [restYearNotifications, setRestYearNotifications] = useState([]);

  const {
    data: todayData,
    refetch: refetchTodayNotifications,
    currentPage: currentTodayPage,
    totalPages: totalTodayPages,
    loading: loadingTodayNotifications,
  } = useFetchTodayNotification(
    organizationId,
    todaysRowsPerPage,
    currentUser.email,
  );

  useEffect(() => {
    setTodaysNotifications(todayData);
  }, [todayData]);

  const {
    data: thisWeekData,
    refetch: refetchThisWeekNotifications,
    currentPage: currentThisWeekPage,
    totalPages: totalThisWeekPages,
    loading: loadingThisWeekNotifications,
  } = useFetchThisWeekNotifications(
    organizationId,
    thisWeekRowsPerPage,
    currentUser.email,
  );

  useEffect(() => {
    setThisWeekNotifications(thisWeekData);
  }, [thisWeekData]);

  const {
    data: lastWeekData,
    refetch: refetchLastWeekNotifications,
    currentPage: currentLastWeekPage,
    totalPages: totalLastWeekPages,
    loading: loadingLastWeekNotifications,
  } = useFetchLastWeekNotifications(
    organizationId,
    lastWeekRowsPerPage,
    currentUser.email,
  );

  useEffect(() => {
    setLastWeekNotifications(lastWeekData);
  }, [lastWeekData]);

  const {
    data: lastMonthData,
    refetch: refetchLastMonthNotifications,
    currentPage: currentLastMonthPage,
    totalPages: totalLastMonthPages,
    loading: loadingLastMonthNotifications,
  } = useFetchLastMonthNotifications(
    organizationId,
    lastMonthRowsPerPage,
    currentUser.email,
  );

  useEffect(() => {
    setLastMonthNotifications(lastMonthData);
  }, [lastMonthData]);

  const {
    data: currentYearData,
    refetch: refetchCurrentYearNotifications,
    currentPage: currentYearPage,
    totalPages: totalCurrentYearPages,
    loading: loadingCurrentNotifications,
  } = useFetchCurrentYearNotifications(
    organizationId,
    currentYearRowsPerPage,
    currentUser.email,
  );

  useEffect(() => {
    setCurrentYearNotifications(currentYearData);
  }, [currentYearData]);

  const {
    data: lastYearData,
    refetch: refetchLastYearNotifications,
    currentPage: currentLastYearPage,
    totalPages: totalLastYearPages,
    loading: loadingLastYearNotifications,
  } = useFetchLastYearNotifications(
    organizationId,
    lastYearRowsPerPage,
    currentUser.email,
  );

  useEffect(() => {
    setLastYearNotifications(lastYearData);
  }, [lastYearData]);

  const {
    data: restYearData,
    refetch: refetchRestYearNotifications,
    currentPage: currentRestYearPage,
    totalPages: totalRestYearPages,
    loading: loadingRestYearNotifications,
  } = useFetchRestYearNotifications(
    organizationId,
    restYearRowsPerPage,
    currentUser.email,
  );

  useEffect(() => {
    setRestYearNotifications(restYearData);
  }, [restYearData]);

  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

  const [section, setSection] = useState('');

  const clearAllHandler = (section: any) => {
    setShowDeleteAllModal(true);
    setSection(section);
  };

  const { trigger: deleteAllByDate } = useDeleteAllNotificationByDate();

  const clearAllAction = () => {
    const body = {
      organizationId: organizationId,
      email: currentUser.email,
      section: section,
    };

    const promise = deleteAllByDate(body)
      .then((res: any) => {
        if (res.success === true) {
          setShowDeleteAllModal(false);
          setSection('');
        }
      })
      .catch((e) => {
        console.log('ERROR clearAllAction', e);
      });
    toast.promise(promise, {
      loading: 'Clearing notifications',
      success: 'Notification removed',
      error: 'Error on removing notification',
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-100 p-2">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2 items-center">
            <p className="font-semibold text-base">Today</p>
          </div>
          <If condition={todayNotifications?.length > 0}>
            <button
              onClick={() => clearAllHandler('today')}
              className="flex bg-white items-center px-4 py-2 rounded-md hover:bg-gray-50 space-x-2"
            >
              <p>Clear All</p>
              <Image src={badgeX} alt="badgeX"></Image>
            </button>
          </If>
        </div>
        <div className="space-y-6 mt-4">
          {loadingTodayNotifications ? (
            <div className="m-auto w-full flex justify-center">
              <LoadingMembersSpinner />
            </div>
          ) : (
            <>
              {todayNotifications?.length > 0 ? (
                todayNotifications.map((item: Notification, index: number) => {
                  return (
                    <Card
                      key={'todayNotifications ' + index}
                      notificaiton={item}
                      organizationId={organizationId}
                      refetch={refetchTodayNotifications}
                      section={'team'}
                      userData={userData}
                    />
                  );
                })
              ) : (
                <div className="bg-white text-xs w-full border py-4 px-6 rounded-md space-y-1">
                  <p>You don&apos;t have notifications</p>
                </div>
              )}
            </>
          )}
          <div className="mt-6">
            <PaginationController
              rowsPerPage={todaysRowsPerPage}
              setRowsPerPage={setTodaysRowsPerPage}
              totalPages={totalTodayPages}
              currentPage={currentTodayPage}
              refetch={refetchTodayNotifications}
            />
          </div>
        </div>
      </div>
      <div className="bg-gray-100 p-2">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2 items-center">
            <p className="font-semibold text-base">This Week</p>
          </div>
          <If condition={thisWeekNotifications?.length > 0}>
            <button
              onClick={() => clearAllHandler('thisWeek')}
              className="flex bg-white items-center px-4 py-2 rounded-md hover:bg-gray-50 space-x-2"
            >
              <p>Clear All</p>
              <Image src={badgeX} alt="badgeX"></Image>
            </button>
          </If>
        </div>
        <div className="space-y-6 mt-4">
          {loadingThisWeekNotifications ? (
            <div className="m-auto w-full flex justify-center">
              <LoadingMembersSpinner />
            </div>
          ) : (
            <>
              {thisWeekNotifications?.length > 0 ? (
                thisWeekNotifications.map(
                  (item: Notification, index: number) => {
                    return (
                      <Card
                        key={'thisWeekNotifications ' + index}
                        notificaiton={item}
                        organizationId={organizationId}
                        refetch={refetchThisWeekNotifications}
                        section={'team'}
                        userData={userData}
                      />
                    );
                  },
                )
              ) : (
                <div className="bg-white text-xs w-full border py-4 px-6 rounded-md space-y-1">
                  <p>You don&apos;t have notifications</p>
                </div>
              )}
            </>
          )}
          <div className="mt-6">
            <PaginationController
              rowsPerPage={thisWeekRowsPerPage}
              setRowsPerPage={setThisWeekRowsPerPage}
              totalPages={totalTodayPages}
              currentPage={currentThisWeekPage}
              refetch={refetchThisWeekNotifications}
            />
          </div>
        </div>
      </div>
      <div className="bg-gray-100 p-2">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2 items-center">
            <p className="font-semibold text-base">Last Week</p>
          </div>
          <If condition={lastWeekNotifications?.length > 0}>
            <button
              onClick={() => clearAllHandler('lastWeek')}
              className="flex bg-white items-center px-4 py-2 rounded-md hover:bg-gray-50 space-x-2"
            >
              <p>Clear All</p>
              <Image src={badgeX} alt="badgeX"></Image>
            </button>
          </If>
        </div>
        <div className="space-y-6 mt-4">
          {loadingLastWeekNotifications ? (
            <div className="m-auto w-full flex justify-center">
              <LoadingMembersSpinner />
            </div>
          ) : (
            <>
              {lastWeekNotifications?.length > 0 ? (
                lastWeekNotifications.map(
                  (item: Notification, index: number) => {
                    return (
                      <Card
                        key={'lastWeekNotifications ' + index}
                        notificaiton={item}
                        organizationId={organizationId}
                        refetch={refetchLastWeekNotifications}
                        userData={userData}
                      />
                    );
                  },
                )
              ) : (
                <div className="bg-white text-xs w-full border py-4 px-6 rounded-md space-y-1">
                  <p>You don&apos;t have notifications</p>
                </div>
              )}
              <div className="mt-6">
                <PaginationController
                  rowsPerPage={lastWeekRowsPerPage}
                  setRowsPerPage={setLastWeekRowsPerPage}
                  totalPages={totalLastWeekPages}
                  currentPage={currentLastWeekPage}
                  refetch={refetchLastWeekNotifications}
                />
              </div>
            </>
          )}
        </div>
      </div>
      <div className="bg-gray-100 p-2">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2 items-center">
            <p className="font-semibold text-base">Last Month</p>
          </div>
          <If condition={lastMonthNotifications?.length > 0}>
            <button
              onClick={() => clearAllHandler('lastMonth')}
              className="flex bg-white items-center px-4 py-2 rounded-md hover:bg-gray-50 space-x-2"
            >
              <p>Clear All</p>
              <Image src={badgeX} alt="badgeX"></Image>
            </button>
          </If>
        </div>

        <div className="space-y-6 mt-4">
          {loadingLastMonthNotifications ? (
            <div className="m-auto w-full flex justify-center">
              <LoadingMembersSpinner />
            </div>
          ) : (
            <>
              {lastMonthNotifications?.length > 0 ? (
                lastMonthNotifications.map(
                  (item: Notification, index: number) => {
                    return (
                      <Card
                        key={'lastMonthNotifications ' + index}
                        notificaiton={item}
                        organizationId={organizationId}
                        refetch={refetchLastMonthNotifications}
                        userData={userData}
                      />
                    );
                  },
                )
              ) : (
                <div className="bg-white text-xs w-full border py-4 px-6 rounded-md space-y-1">
                  <p>You don&apos;t have notifications</p>
                </div>
              )}
              <div className="mt-6">
                <PaginationController
                  rowsPerPage={lastMonthRowsPerPage}
                  setRowsPerPage={setLastMonthRowsPerPage}
                  totalPages={totalLastMonthPages}
                  currentPage={currentLastMonthPage}
                  refetch={refetchLastMonthNotifications}
                />
              </div>
            </>
          )}
        </div>
      </div>
      <div className="bg-gray-100 p-2">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2 items-center">
            <p className="font-semibold text-base">Current Year</p>
          </div>
          <If condition={currentYearNotifications?.length > 0}>
            <button
              onClick={() => clearAllHandler('currentYear')}
              className="flex bg-white items-center px-4 py-2 rounded-md hover:bg-gray-50 space-x-2"
            >
              <p>Clear All</p>
              <Image src={badgeX} alt="badgeX"></Image>
            </button>
          </If>
        </div>

        <div className="space-y-6 mt-4">
          {loadingCurrentNotifications ? (
            <div className="m-auto w-full flex justify-center">
              <LoadingMembersSpinner />
            </div>
          ) : (
            <>
              {currentYearNotifications?.length > 0 ? (
                currentYearNotifications.map(
                  (item: Notification, index: number) => {
                    return (
                      <Card
                        key={'currentYearNotifications ' + index}
                        notificaiton={item}
                        organizationId={organizationId}
                        refetch={refetchCurrentYearNotifications}
                        userData={userData}
                      />
                    );
                  },
                )
              ) : (
                <div className="bg-white text-xs w-full border py-4 px-6 rounded-md space-y-1">
                  <p>You don&apos;t have notifications</p>
                </div>
              )}
              <div className="mt-6">
                <PaginationController
                  rowsPerPage={currentYearRowsPerPage}
                  setRowsPerPage={setCurrentYearRowsPerPage}
                  totalPages={totalCurrentYearPages}
                  currentPage={currentYearPage}
                  refetch={refetchCurrentYearNotifications}
                />
              </div>
            </>
          )}
        </div>
      </div>
      <div className="bg-gray-100 p-2">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2 items-center">
            <p className="font-semibold text-base">Last Year</p>
          </div>
          <If condition={lastYearNotifications?.length > 0}>
            <button
              onClick={() => clearAllHandler('lastYear')}
              className="flex bg-white items-center px-4 py-2 rounded-md hover:bg-gray-50 space-x-2"
            >
              <p>Clear All</p>
              <Image src={badgeX} alt="badgeX"></Image>
            </button>
          </If>
        </div>

        <div className="space-y-6 mt-4">
          {loadingLastYearNotifications ? (
            <div className="m-auto w-full flex justify-center">
              <LoadingMembersSpinner />
            </div>
          ) : (
            <>
              {lastYearNotifications?.length > 0 ? (
                lastYearNotifications.map(
                  (item: Notification, index: number) => {
                    return (
                      <Card
                        key={'lastYearNotifications ' + index}
                        notificaiton={item}
                        organizationId={organizationId}
                        refetch={refetchLastYearNotifications}
                        userData={userData}
                      />
                    );
                  },
                )
              ) : (
                <div className="bg-white text-xs w-full border py-4 px-6 rounded-md space-y-1">
                  <p>You don&apos;t have notifications</p>
                </div>
              )}
              <div className="mt-6">
                <PaginationController
                  rowsPerPage={lastYearRowsPerPage}
                  setRowsPerPage={setLastYearRowsPerPage}
                  totalPages={totalLastYearPages}
                  currentPage={currentLastYearPage}
                  refetch={refetchLastYearNotifications}
                />
              </div>
            </>
          )}
        </div>
      </div>
      <div className="bg-gray-100 p-2">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2 items-center">
            <p className="font-semibold text-base">Rest of Years</p>
          </div>
          <If condition={restYearNotifications?.length > 0}>
            <button
              onClick={() => clearAllHandler('restYears')}
              className="flex bg-white items-center px-4 py-2 rounded-md hover:bg-gray-50 space-x-2"
            >
              <p>Clear All</p>
              <Image src={badgeX} alt="badgeX"></Image>
            </button>
          </If>
        </div>

        <div className="space-y-6 mt-4">
          {loadingRestYearNotifications ? (
            <div className="m-auto w-full flex justify-center">
              <LoadingMembersSpinner />
            </div>
          ) : (
            <>
              {restYearNotifications?.length > 0 ? (
                restYearNotifications.map(
                  (item: Notification, index: number) => {
                    return (
                      <Card
                        key={'restYearNotifications ' + index}
                        notificaiton={item}
                        organizationId={organizationId}
                        refetch={refetchRestYearNotifications}
                        userData={userData}
                      />
                    );
                  },
                )
              ) : (
                <div className="bg-white text-xs w-full border py-4 px-6 rounded-md space-y-1">
                  <p>You don&apos;t have notifications</p>
                </div>
              )}
              <div className="mt-6">
                <PaginationController
                  rowsPerPage={restYearRowsPerPage}
                  setRowsPerPage={setRestYearRowsPerPage}
                  totalPages={totalRestYearPages}
                  currentPage={currentRestYearPage}
                  refetch={refetchRestYearNotifications}
                />
              </div>
            </>
          )}
        </div>
      </div>
      <DeleteModal
        message="Are you sure you want to delete all notifications?"
        showModal={showDeleteAllModal}
        setShowModal={setShowDeleteAllModal}
        confirmAction={clearAllAction}
      ></DeleteModal>
    </div>
  );
};

const Card = ({ notificaiton, organizationId, userData }: any) => {
  const id = notificaiton.id;

  const { trigger: deleteNotification } = useDeleteNotification(
    id,
    organizationId,
  );

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { t } = useTranslation();

  const [isExpired, setIsExpired] = useState(false);

  const router = useRouter();

  const onDeleteNotification = useCallback(async () => {
    const promise = deleteNotification()
      .then((res: any) => {
        if (res.success === true) {
          setShowDeleteModal(false);
        }
      })
      .catch((e: any) => {
        console.error('ERROR onDeleteNotification', e);
      });
    toast.promise(promise, {
      loading: 'Removing notification',
      success: 'Notification removed',
      error: 'Error on removing notification',
    });
  }, [deleteNotification]);

  const deleteNotificationHandler = () => {
    setShowDeleteModal(true);
  };

  const { trigger: addMemberToOrganization } = useAddMemberToOrganizationTeam(
    notificaiton.information.organizationId,
    notificaiton.information.teamId,
  );

  const { trigger: addMemberToBoard } = useAddMemberToBoard(
    notificaiton.information.organizationId,
  );

  const updateNotification = useUpdateNotifications();
  const updateNotificationById = useUpdateNotificationById();

  useEffect(() => {
    updateNotification(organizationId, 'seen', userData.email);
  }, []);

  const acceptInvitationHandler = () => {
    const isTeamType = notificaiton.information.retrospectiveId === '';

    if (isTeamType) {
      const body = { code: notificaiton.code };
      const promise = addMemberToOrganization(body)
        .then((res: any) => {
          if (res.success) {
            updateNotification(organizationId, id, 'accept');
          }
        })
        .catch((error) => {
          console.log('error', error);
        });

      toaster.promise(promise, {
        loading: t('auth:acceptingInvite'),
        success: t('auth:acceptInviteSuccess'),
        error: t('auth:acceptInviteError'),
      });
    } else {
      const body = {
        code: notificaiton.code,
        type: notificaiton.information.type,
        name: userData.name,
        lastName: userData.lastName,
        retrospectiveId: notificaiton.information.retrospectiveId,
        teamId: notificaiton.information.teamId,
      };
      const promise = addMemberToBoard(body)
        .then((res: any) => {
          if (res.success) {
            updateNotificationById(organizationId, 'accept', id).then((res) => {
              if (res === 'success') {
                router.push(
                  `/board/${notificaiton.information.retrospectiveId}`,
                );
              }
            });
          }
        })
        .catch((error) => {
          console.log('error', error);
        });

      toaster.promise(promise, {
        loading: t('auth:acceptingInvite'),
        success: t('auth:acceptInviteSuccess'),
        error: t('auth:acceptInviteError'),
      });
    }
  };

  useEffect(() => {
    function isExpired(createdTimestamp: any) {
      const createdTimeMillis =
        createdTimestamp.seconds * 1000 +
        createdTimestamp.nanoseconds / 1000000;

      const currentTimeMillis = Date.now();

      const hoursDiff =
        (currentTimeMillis - createdTimeMillis) / (1000 * 60 * 60);

      return hoursDiff >= 24;
    }

    if (notificaiton.category === 'invite') {
      const isInviteExpired = isExpired(notificaiton.created);

      setIsExpired(isInviteExpired);
    }
  }, [notificaiton]);

  return (
    <div key={'notifications ' + id} className="flex space-x-2 w-full">
      <div className={`bg-white w-full border py-4 px-6 rounded-md space-y-1`}>
        <p className="font-semibold text-sm">{notificaiton.title}</p>
        <div className="flex">
          <If condition={notificaiton.seen}>
            <div className="w-[20px] h-[20px] mx-1 flex justify-center items-center">
              <Tooltip>
                <TooltipContent>seen</TooltipContent>
                <TooltipTrigger>
                  <Image
                    alt="checkmark"
                    width={30}
                    height={30}
                    src={checkmark}
                  />
                </TooltipTrigger>
              </Tooltip>
            </div>
          </If>

          <div
            className="text-xs"
            dangerouslySetInnerHTML={{ __html: notificaiton.subtitle }}
          />
        </div>

        <p className="text-xs italic text-[#09090B80]">
          {getDateStatus(notificaiton.created)}
        </p>
        <If condition={notificaiton.category === 'invite'}>
          {!isExpired ? (
            <button
              disabled={notificaiton.accept}
              onClick={acceptInvitationHandler}
              className="flex items-center space-x-2 bg-green-100 disabled:hover:bg-green-100 hover:bg-green-50 px-4 py-2 rounded-md"
            >
              <Image src={badgeCheck} alt="badgeCheck"></Image>
              <p>{notificaiton.accept ? 'Accepted' : 'Accept'}</p>
            </button>
          ) : (
            <button className="flex items-center space-x-2 bg-red-100  px-4 py-2 rounded-md">
              <Image src={badgeX} alt="badgeX"></Image>
              <p>Expired</p>
            </button>
          )}
        </If>
      </div>
      <If
        condition={
          notificaiton.category !== 'invite' ||
          notificaiton?.accept ||
          isExpired
        }
      >
        <button onClick={deleteNotificationHandler}>
          <Image alt="trash" src={trash}></Image>
        </button>
      </If>
      <DeleteModal
        message="Are you sure you want to delete this notification?"
        showModal={showDeleteModal}
        setShowModal={setShowDeleteModal}
        confirmAction={onDeleteNotification}
      ></DeleteModal>
    </div>
  );
};
