import { useCallback, useEffect, useState } from 'react';
import { useAuth } from 'reactfire';
import toast, { type Toast } from 'react-hot-toast';
import toaster from 'react-hot-toast';

import { useRouter } from 'next/router';
import Image from 'next/image';

import { SelectionBar } from '../shared/SelectionBar';
import TimerModal from '../shared/timerSidebar/timerModal';

import IcebreakerHeader from '../layouts/sidebar/IcebreakerHeader';

import { useIcebreakers } from '~/lib/icebreakers/hooks/use-icebreakers';
import { usePatchRetrospective } from '~/lib/retrospectives/hooks/use-patch-retrospective-by-id';
import { useCurrentOrganization } from '~/lib/organizations/hooks/use-current-organization';
import { useCurrentTeam } from '~/lib/organizations/hooks/use-current-team';
import { useGetBoardByRetrospectiveId } from '~/lib/board/hooks/use-get-board-by-retrospective';
import { TeamMembers } from '~/lib/teams/types/teams';
import { RequestsBoard } from '~/lib/board/types/membership-role';
import useAcceptMemberToBoard from '~/lib/board/hooks/use-accept-member-to-board';
import { MembershipRole } from '~/lib/organizations/types/membership-role';
import { useUpdateStatusBoardMember } from '~/lib/board/hooks/use-update-status-members';
import { useCurrentUserRole } from '~/lib/organizations/hooks/use-current-user-role';
import { usePatchOrganization } from '~/lib/organizations/hooks/use-patch-organization';
import { useGetOrganizationById } from '~/lib/organizations/hooks/use-get-organization-by-id';
import { useSetTimer } from '~/lib/board/hooks/use-set-timer';

import questionMark from 'public/assets/svg/question-mark-circled.svg';

import If from '~/core/ui/If';

import Cookies from 'js-cookie';

export default function IcebreakerConfig({
  retrospectiveId,
}: {
  retrospectiveId: string;
}) {
  const [icebreaker, setIcebreaker] = useState<string | null>(null);

  const organization = useCurrentOrganization();
  const organizationId = organization?.id as string;

  const { organization: organizationData } =
    useGetOrganizationById(organizationId);

  const { team } = useCurrentTeam();
  const teamId = team?.id as string;

  const router = useRouter();

  const [retrospectiveData, setRetrospectiveData] = useState<any>([]);
  const [hasDisplayedToaster, setHasDisplayedToaster] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState(0);

  const [requests, setRequests] = useState<RequestsBoard[]>([]);
  const [allBoardRequests, setAllRequests] = useState<RequestsBoard[]>([]);

  const [showMembersSidebar, setShowMembersSidebar] = useState(false);

  const auth = useAuth();
  const currentUser = auth.currentUser;

  const { patchRetrospective, loading, error } =
    usePatchRetrospective(organizationId);

  const { getRandomIcebreaker, categories } = useIcebreakers();

  const [category, setCategory] = useState<string>('');
  const [categoryColor, setCategoryColor] = useState('');

  const changeCategory = (newCategory: string) => {
    const icebreaker = getRandomIcebreaker(newCategory);
    if (retrospectiveId) {
      patchRetrospective({
        icebreaker_info: {
          question: icebreaker as string,
          category: newCategory,
        },
        id: retrospectiveId,
      });
    } else {
      patchOrganization({
        icebreaker_info: {
          question: icebreaker as string,
          category: newCategory,
        },
      });
    }
  };

  // TIMER FUNCTIONS

  const [sound, setSound] = useState('');

  const updateTimer = useSetTimer();
  const { patchOrganization } = usePatchOrganization(organizationId);

  // Update the timer in Firestore when minute, second, play, or pause changes
  const onSetTimer = useCallback(
    async (
      minute: any,
      second: any,
      play: boolean,
      pause: boolean,
      show: boolean,
    ) => {
      try {
        if (retrospectiveId && currentUserRole === MembershipRole.Facilitator) {
          await updateTimer(
            organizationId,
            retrospectiveId,
            minute,
            second,
            play,
            pause,
            show,
            sound,
          );
        } else if (currentUserRole === MembershipRole.Facilitator) {
          patchOrganization({
            minute,
            second,
            play,
            pause,
            showTimerModal: show,
            sound,
          });
        }
      } catch (e) {
        console.error('Error updating timer', e);
      }
    },
    [
      organizationId,
      retrospectiveId,
      updateTimer,
      patchOrganization,
      currentUserRole,
      sound,
    ],
  );

  useEffect(() => {
    const handleRouteChange = () => {
      onSetTimer(5, 0, false, true, false);
    };

    router.events.on('routeChangeStart', handleRouteChange);

    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router, onSetTimer]);

  // Redirect to retrospective
  async function handleStartRetrospective() {
    try {
      await patchRetrospective({
        icebreaker_info: {
          question: icebreaker as string,
          category: category,
        },
        id: retrospectiveId,
      });
  
      if (!error) {
        onUpdateRoleMemberRequested('href', `/board/${retrospectiveId}`);
      } else {
        console.error('Error detected in patchRetrospective', error);
      }
    } catch (err) {
      console.error('Error during handleStartRetrospective:', err);
    }
  }
  
  useEffect(() => {
    if (categories.length > 0) {
      const defaultCategory = categories[0] as any;
      setCategoryColor(defaultCategory?.color);
    }
  }, [categories]);

  const {
    retrospective,
    pendingRequests,
    requests: allRequests,
    fetchPendingRequests,
    fetchBoard,
    members: boardMembers = [],
  } = useGetBoardByRetrospectiveId(organizationId, retrospectiveId);

  const { trigger: acceptMemberBoard, isMutating } =
    useAcceptMemberToBoard(organizationId);

  function redirectToRemovedPage(id: string, organizationId: string) {
    router.push(`/board/${id}/removed?organization=${organizationId}`);
  }

  const acceptMemberToBoard = useCallback(
    async (userId: string, accept: boolean, toastId: any) => {
      const body = {
        userId,
        accept,
        retrospectiveId,
        organizationId,
        teamId,
      } as any;

      const promise = acceptMemberBoard(body).then(() => {
        toast.dismiss(toastId);
        fetchBoard();
      });

      await toaster.promise(promise, {
        loading: accept
          ? 'Accepting user to the board'
          : 'Denying access to user',
        success: accept ? 'User has been accepted' : 'Request has been denied',
        error: accept ? 'Error accepting request' : 'Error denying access',
      });
    },
    [acceptMemberBoard, retrospectiveId, organizationId, teamId, fetchBoard],
  );

  useEffect(() => {
    if (retrospectiveId) {
      if (retrospective) {
        setRetrospectiveData(retrospective);
        if (retrospective?.icebreaker_info) {
          setCategory(retrospective?.icebreaker_info.category);
          setIcebreaker(retrospective?.icebreaker_info.question);
          const categoriesColor = categories.find(
            (item: any) =>
              item.category === retrospective?.icebreaker_info.category,
          ) as any;
          setCategoryColor(categoriesColor?.color);
        } else if (categories?.length > 0) {
          changeCategory(categories[0].category);
        }
      }
    } else if (organizationData) {
      if (organizationData?.icebreaker_info) {
        setCategory(organizationData?.icebreaker_info.category);
        setIcebreaker(organizationData?.icebreaker_info.question);
        const categoriesColor = categories.find(
          (item: any) =>
            item.category === organizationData?.icebreaker_info.category,
        ) as any;
        setCategoryColor(categoriesColor?.color);
      } else if (categories?.length > 0) {
        changeCategory(categories[0].category);
      }
    }
  }, [retrospective, categories, retrospectiveId, organizationData]);

  const currentOrgRole = useCurrentUserRole();

  // Check user's current role
  useEffect(() => {
    if (boardMembers?.length > 0) {
      const findUserById = (): TeamMembers | undefined => {
        return boardMembers.find(
          (member: TeamMembers) => member.userId === currentUser?.uid,
        );
      };
      const userFound = findUserById();
      if (userFound) {
        if (!userFound.active) {
          redirectToRemovedPage(retrospectiveData.id, organizationId);
        }
        setCurrentUserRole(userFound.role);
        if (userFound.role > 0) {
          fetchPendingRequests();
        }
      }
    } else {
      setCurrentUserRole(currentOrgRole as number);
    }
  }, [boardMembers, currentUser]);

  useEffect(() => {
    if (pendingRequests) {
      setRequests(pendingRequests);
      setHasDisplayedToaster(false);
    }
  }, [pendingRequests]);

  //Show request if the user is a facilitator
  useEffect(() => {
    if (!hasDisplayedToaster) {
      if (
        retrospectiveData.name &&
        currentUserRole === MembershipRole.Facilitator &&
        requests.length > 0
      ) {
        if (requests.length > 1) {
          toast(
            (t: Toast) => (
              <div className="flex justify-between items-center space-x-4">
                <div>
                  <b className="text-md">Access to Board</b>
                  <br />
                  <p className="inline text-sm">
                    You have <b>{requests.length} request</b> to join this
                    Board,{' '}
                    <a
                      onClick={() => {
                        setShowMembersSidebar(true);
                        toast.dismiss(t.id);
                      }}
                      className="text-blue-500 underline cursor-pointer"
                    >
                      click here
                    </a>{' '}
                    to admit these members
                  </p>
                </div>
                <button
                  className="ml-auto mt-2 border border-blue-500 rounded-md text-blue-500 py-2 px-4"
                  onClick={() => toast.dismiss(t.id)}
                >
                  Close
                </button>
              </div>
            ),
            {
              duration: Infinity,
              position: 'bottom-right',
              id: 'requests',
            },
          );
        } else {
          toast(
            (t: Toast) => (
              <div className="flex justify-between items-center space-x-4">
                <div>
                  <b className="text-md">Access to Board</b>
                  <br />
                  <p className="inline text-sm">
                    {requests[0].email !== ''
                      ? requests[0].email
                      : requests[0].userName}{' '}
                    is requesting access to {retrospectiveData?.name}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    className="ml-auto mt-2 border border-blue-500 rounded-md text-blue-500 py-2 px-4"
                    onClick={() => {
                      toaster.dismiss(t.id);
                      acceptMemberToBoard(requests[0].userId, true, t.id);
                    }}
                  >
                    Yes
                  </button>
                  <button
                    className="ml-auto mt-2 border border-red-500 rounded-md text-red-500 py-2 px-4"
                    onClick={() => {
                      toaster.dismiss(t.id);
                      acceptMemberToBoard(requests[0].userId, false, t.id);
                    }}
                  >
                    No
                  </button>
                </div>
              </div>
            ),
            {
              duration: Infinity,
              position: 'bottom-right',
              id: 'requests',
            },
          );
        }
        setHasDisplayedToaster(true);
      }
      return () => {
        toast.dismiss('requests');
      };
    }
  }, [
    currentUserRole,
    requests,
    acceptMemberToBoard,
    hasDisplayedToaster,
    retrospectiveData,
  ]);

  useEffect(() => {
    if (allRequests) {
      setAllRequests(allRequests);
    }
  }, [allRequests]);

  const [minute, setMinute] = useState(5);
  const [second, setSecond] = useState(0);

  const [play, setPlay] = useState(false);
  const [pause, setPause] = useState(false);

  const [showPlayModal, setShowPlayModal] = useState(false);
  const [showTimerSidebar, setShowTimerSidebar] = useState(false);
  const start = Cookies.get('startBoard');

  const updateMemberStatus = useUpdateStatusBoardMember();

  const onUpdateRoleMemberRequested = useCallback(
    (type: string, value: any) => {
      void (async () => {
        try {
          updateMemberStatus(
            organizationId,
            teamId,
            retrospectiveId,
            currentUser?.uid as string,
            type,
            value,
          );
        } catch (e) {
          console.error(e);
        }
      })();
    },
    [updateMemberStatus, organizationId, retrospectiveId, teamId, currentUser],
  );

  useEffect(() => {
    if (retrospective?.href) {
      if (
        retrospective.href !== `/icebreaker?id=${retrospectiveId}` &&
        retrospectiveId &&
        typeof window !== 'undefined'
      ) {
        router.push(retrospective.href as string);
      }
    }
  }, [retrospectiveId, retrospective]);

  return (
    <div>
      {(showMembersSidebar || showTimerSidebar) && (
        <div className="fixed top-0 left-0 w-full h-full bg-black opacity-20 z-10 pointer-events-auto "></div>
      )}
      <IcebreakerHeader
        setShowPlayModal={setShowPlayModal}
        minute={minute}
        setMinute={setMinute}
        second={second}
        setSecond={setSecond}
        sound={sound}
        setSound={setSound}
        setPlay={setPlay}
        setPause={setPause}
        showMembersSidebar={showMembersSidebar}
        setShowMembersSidebar={setShowMembersSidebar}
        requests={allBoardRequests}
        currentUserRole={currentUserRole}
        acceptMemberToBoard={acceptMemberToBoard}
        showTimerSidebar={showTimerSidebar}
        setShowTimerSidebar={setShowTimerSidebar}
      />
      <div
        id="screen"
        style={{
          height: '-webkit-fill-available',
          width: '-webkit-fill-available',
        }}
        className={`flex-1 absolute space-y-4 md:space-y-16 pt-6 px-8 py-6 tv:px-36 flex flex-col flex-1 overflow-auto bg-${categoryColor}`}
      >
        <div className="md:flex justify-between items-center py-5 space-y-6 md:space-y-0">
          <h1 className="text-3xl font-semibold">Ice Breaker</h1>
          <If
            condition={
              retrospectiveId && currentUserRole === MembershipRole.Facilitator
            }
          >
            <button
              className={`flex justify-center ${
                start === 'true'
                  ? 'bg-orange-500 hover:bg-orange-400  text-white'
                  : 'bg-white hover:bg-gray-100 text-black'
              } py-2 px-4 rounded-md cursor-pointer`}
              onClick={handleStartRetrospective}
              disabled={!icebreaker || loading}
            >
              {start === 'true' ? (
                <span> Start Retrospective</span>
              ) : (
                <span> Back to retrospective</span>
              )}
            </button>
          </If>
        </div>
        <div>
          <If condition={currentUserRole === MembershipRole.Facilitator}>
            <SelectionBar
              options={categories}
              selected={category}
              setSelected={changeCategory}
            />
          </If>
        </div>
        <div className="flex justify-center">
          <div className="bg-white flex flex-col justify-center items-center border rounded-md border-zinc-100 shadow min-w-[85%] min-h-[24rem] px-12">
            <div className="text-2xl font-bold pb-12 text-center">
              {icebreaker}
            </div>
            <If
              condition={
                currentUserRole === MembershipRole.Facilitator ||
                !retrospectiveId
              }
            >
              <button
                className="flex w-full max-w-[28rem] justify-center items-center bg-red-500 hover:bg-red-400 text-white text-sm py-2 px-4 rounded-md"
                onClick={() => {
                  changeCategory(category);
                }}
              >
                <Image className="mr-2 w-auto" src={questionMark} alt="" />
                Generate New Question
              </button>
            </If>
          </div>
        </div>
      </div>
      <TimerModal
        organizationId={organizationId}
        retrospectiveId={retrospectiveId}
        minute={minute}
        setMinute={setMinute}
        second={second}
        setSecond={setSecond}
        sound={sound}
        play={play}
        setPlay={setPlay}
        pause={pause}
        setPause={setPause}
        currentUserRole={currentUserRole}
      />
    </div>
  );
}
