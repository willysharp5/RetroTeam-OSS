import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from 'reactfire';
import toast, { type Toast } from 'react-hot-toast';
import toaster from 'react-hot-toast';

import Image from 'next/image';
import { useRouter } from 'next/router';

import lock from '/public/assets/svg/lock-closed.svg';
import eye from '/public/assets/svg/eye-closed.svg';
import eyeOn from '/public/assets/svg/eye-open.svg';
import settings from '/public/assets/svg/settings.svg';

import {
  HeaderProps,
  CaptureContentProps,
  Group,
  Comment,
} from '~/lib/board/types/types';
import { useCurrentOrganization } from '~/lib/organizations/hooks/use-current-organization';
import { Id } from '~/lib/actions/types/actions';

import Board from '~/components/board/BoardPage/board/Board';
import BoardHeader from '~/components/layouts/sidebar/BoardHeader';
import ActionsPage from '~/components/board/ActionsPage/ActionsPage';
import useFetchComments from '~/lib/server/board/get-comments';
import { useGetBoardByRetrospectiveId } from '~/lib/board/hooks/use-get-board-by-retrospective';
import { TeamMembers } from '~/lib/teams/types/teams';

import GroupPage from '../GroupPage/GroupPage';
import VotePage from '../VotePage/VotePage';

import PageLoadingIndicator from '~/core/ui/PageLoadingIndicator';
import useAcceptMemberToBoard from '~/lib/board/hooks/use-accept-member-to-board';
import { RequestsBoard } from '~/lib/board/types/membership-role';
import TimerModal from '~/components/shared/timerSidebar/timerModal';
import useFetchRetroTeamTags from '~/lib/server/board/tags/get-tags';
import useFetchGroups from '~/lib/server/board/get-groups';
import useUpdateGroup from '~/lib/board/hooks/use-update-group';
import useFetchRules from '~/lib/server/rules/get-rules';
import { useUpdateBoardSettings } from '~/lib/board/hooks/use-update-show-authors';
import { useUpdateStatusBoardMember } from '~/lib/board/hooks/use-update-status-members';
import useEndRetrospective from '~/lib/board/hooks/use-end-retrospective';
import If from '~/core/ui/If';
import { Tooltip, TooltipTrigger, TooltipContent } from '~/core/ui/Tooltip';
import { MembershipRole } from '~/lib/organizations/types/membership-role';
import { useGetOrganizationById } from '~/lib/organizations/hooks/use-get-organization-by-id';

import { useCurrentSubscriptionById } from '~/lib/entitlements/hooks/use-entitlements';
import { Restrictions } from '~/lib/entitlements/types';
import RegenerateAiButton from '~/components/shared/regenerateAiButton';
import Layout from '~/core/ui/Layout';
import { useSetTimer } from '~/lib/board/hooks/use-set-timer';

const messages = [
  {
    title: 'Capture Stage',
    description: 'Share comments and insights',
  },
  {
    title: 'Group Stage',
    description: 'Only Facilitators can group Comments',
    color: 'red',
  },
  {
    title: 'Vote Stage',
    description: 'Prioritize and identify themes based on importance.',
  },
  {
    title: 'Actions Stage',
    description: 'Identify and list items to work on.',
  },
];

export default function BoardPage() {
  const currentOrganization = useCurrentOrganization();
  const organizationId = currentOrganization?.id as string;
  const subscriptionId = currentOrganization?.subscription?.priceId;

  const auth = useAuth();
  const currentUser = auth.currentUser;
  const userId = currentUser?.uid as string;

  const router = useRouter();
  const { id } = router.query;

  const retrospectiveId = id as string;

  const [currentUserRole, setCurrentUserRole] = useState(0);
  const [selectedTab, setSelectedTab] = useState(0);

  // TIMER FUNCTIONS
  const [sound, setSound] = useState('');
  const updateTimer = useSetTimer();

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
        }
      } catch (e) {
        console.error('Error updating timer', e);
      }
    },
    [organizationId, retrospectiveId, updateTimer, currentUserRole, sound],
  );

  useEffect(() => {
    const handleRouteChange = () => {
      onSetTimer(5, 0, false, true, false);
    };

    router.events.on('routeChangeStart', handleRouteChange);

    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router]);

  useEffect(() => {
    onSetTimer(5, 0, false, true, false);
  }, [selectedTab]);

  const {
    organization: organizationData,
    loading: loadingOrganization,
    error: errorOrganization,
  } = useGetOrganizationById(organizationId);

  const [organization, setOrganization] = useState<any>();
  const [restrictions, setRestrictions] = useState<Restrictions>();
  // This open-source build has no usage limits, so AI actions are never
  // rationed. Kept as a value rather than deleted so the (inert) prop chain
  // down to the board components stays intact.
  const aiRemaining = Number.POSITIVE_INFINITY;

  const { product } = useCurrentSubscriptionById(
    subscriptionId,
    organization?.subscription?.status,
  );

  useEffect(() => {
    setOrganization(organizationData);
  }, [organizationData]);

  useEffect(() => {
    if (product) {
      setRestrictions(product);
    }
  }, [product]);

  const {
    retrospective,
    loading,
    error,
    pendingRequests,
    requests: allRequests,
    fetchPendingRequests,
    fetchBoard,
    members: boardMembers = [],
  } = useGetBoardByRetrospectiveId(organizationId, retrospectiveId);

  const { data: tags, loading: loadingTags } = useFetchRetroTeamTags();

  const { trigger: acceptMemberBoard, isMutating } =
    useAcceptMemberToBoard(organizationId);
  const { trigger: updateGroup } = useUpdateGroup();

  const teamId = retrospective?.teamId;

  const { data: rules } = useFetchRules('boards');

  const { data: aiRules } = useFetchRules('ai');

  const [canUseAI, setCanUseAI] = useState(false);
  const [canGroupAI, setCanGroupAI] = useState(false);

  useEffect(() => {
    if (aiRules) {
      setCanUseAI(aiRules.useAI);
      setCanGroupAI(aiRules.groupingAI);
    }
  }, [aiRules]);

  const [allowViewAllComments, setAllowViewAllComments] = useState(false);

  const {
    data,
    loading: loadingComments,
    allComments,
  } = useFetchComments(
    organizationId,
    teamId,
    retrospectiveId,
    allowViewAllComments,
    currentUserRole,
    userId,
    selectedTab,
  );

  const { data: groupData, loading: loadingGroups } = useFetchGroups(
    organizationId,
    teamId,
    retrospectiveId,
    allowViewAllComments,
    currentUserRole,
    selectedTab,
  );

  const updateBoardSettings = useUpdateBoardSettings();

  const [showMembersSidebar, setShowMembersSidebar] = useState(false);
  const [loadingRetrospective, setLoadingRetrospective] = useState(true);
  const [teamMembers, setTeamMembers] = useState([]);
  const [tasks, setTasks] = useState<Comment[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [retrospectiveData, setRetrospectiveData] = useState<any>([]);

  const [requests, setRequests] = useState<RequestsBoard[]>([]);
  const [allBoardRequests, setAllRequests] = useState<RequestsBoard[]>([]);
  const [members, setMembers] = useState<TeamMembers[]>([]);

  const [hasDisplayedToaster, setHasDisplayedToaster] = useState(false);

  const [minute, setMinute] = useState(5);
  const [second, setSecond] = useState(0);

  const [voteNumber, setVoteNumber] = useState(0);
  const [settingsVotes, setSettingsVotes] = useState(0);

  const [play, setPlay] = useState(false);
  const [pause, setPause] = useState(false);

  const [showSettingsModal, setShowSettingsModal] = useState(true);

  const [totalVotes, setTotalVotes] = useState(0);

  const [hasRedirected, setHasRedirected] = useState(false);

  const loadingBoard =
    loadingRetrospective || loadingComments || loadingGroups || loadingTags;

  useEffect(() => {
    const votesByVoter: Record<string, number> = {};

    tasks.forEach((item: Comment) => {
      const voters = item.voters;

      for (const voterId in voters) {
        const votes = voters[voterId].votes;
        votesByVoter[voterId] = (votesByVoter[voterId] || 0) + votes;
      }
    });

    groups.forEach((item: Group) => {
      const voters = item.voters;

      for (const voterId in voters) {
        const votes = voters[voterId].votes;
        votesByVoter[voterId] = (votesByVoter[voterId] || 0) + votes;
      }
    });

    const maxVotes = Math.max(...Object.values(votesByVoter), 0);
    setTotalVotes(maxVotes);
  }, [tasks, groups]);

  const onUpdateGroup = async (group: Group, order: number, status:string) => {
    const body = {
      id: group.id,
      name: group.name,
      organizationId,
      retrospectiveId,
      status: status,
      order: order,
      tags: group.tags,
    };

    updateGroup(body)
      .then((res: any) => {})
      .catch((e: any) => {
        console.error('ERROR onUpdateGroup', e);
      });
  };

  useEffect(() => {
    if (retrospective) {
      setRetrospectiveData(retrospective);
      setSettingsVotes(retrospective.votes);
      setLoadingRetrospective(false);
    }
  }, [retrospective]);

  useEffect(() => {
    if (retrospective) {
      if (currentUserRole === MembershipRole.Facilitator) {
        setAllowViewAllComments(true);
      } else {
        if (retrospective.allowMembersViewComments) {
          setAllowViewAllComments(true);
        } else {
          setAllowViewAllComments(false);
        }
      }
    }
  }, [currentUserRole, retrospective]);

  // Sort members
  useEffect(() => {
    if (boardMembers.length > 0) {
      const sort = boardMembers.sort((a: any, b: any) => {
        if (a.role > b.role) {
          return -1;
        } else if (a.role < b.role) {
          return 1;
        } else {
          if (a.active && !b.active) {
            return -1;
          } else if (!a.active && b.active) {
            return 1;
          } else {
            const dateA = new Date(a.created) as any;
            const dateB = new Date(b.created) as any;
            return dateA - dateB;
          }
        }
      });
      setMembers(sort);
    }
  }, [boardMembers]);

  // Check user's current role
  useEffect(() => {
    if (boardMembers) {
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
    }
  }, [boardMembers, currentUser]);

  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (data && !isProcessing) {
      setTasks(data);
    }
  }, [data, isProcessing]);

  useEffect(() => {
    if (groupData && !isProcessing) {
      setGroups(groupData);
    }
  }, [groupData, isProcessing]);

  // Get user votes number
  useEffect(() => {
    let totalVotes = 0;

    // Use local state (tasks and groups) instead of database data (groupData)
    // This ensures voteNumber updates immediately with optimistic updates
    if (groups) {
      if (groups?.length > 0) {
        groups.map((group, index) => {
          if (group.voters) {
            if (group.voters[userId]) {
              totalVotes = totalVotes + group.voters[userId].votes;
            }
          }
        });
      }
    }
    if (tasks) {
      if (tasks?.length > 0) {
        tasks.map((comment, index) => {
          if (comment.voters) {
            if (comment.voters[userId]) {
              totalVotes = totalVotes + comment.voters[userId].votes;
            }
          }
        });
      }
    }
    
    setVoteNumber(totalVotes);
  }, [groups, tasks, userId]); // Use local state instead of database data

  useEffect(() => {
    if (pendingRequests) {
      setRequests(pendingRequests);
      setHasDisplayedToaster(false);
    }
  }, [pendingRequests]);

  useEffect(() => {
    if (allRequests) {
      setAllRequests(allRequests);
    }
  }, [allRequests]);

  useEffect(() => {
    if (boardMembers && !arraysAreEqual(boardMembers, teamMembers)) {
      setTeamMembers(boardMembers);
    }
  }, [boardMembers, teamMembers]);

  //Show request if the user is a facilitator
  useEffect(() => {
    if (!hasDisplayedToaster) {
      if (
        retrospectiveData.name &&
        currentUserRole > 0 &&
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
  }, [currentUserRole, requests]);

  // Show stage popup
  useEffect(() => {
    if (!loadingBoard) {
      if (selectedTab !== 3) {
        setVoteNumber(0);
      }
      toast.dismiss('tab' + selectedTab);
      if (selectedTab > 0) {
        toast(
          (t: Toast) => (
            <div className="w-[311px] h-[72px] flex justify-between items-center space-x-4">
              <div>
                <b className="text-md">{messages[selectedTab - 1].title}</b>
                <br />
                <p
                  className={`inline text-sm  ${
                    messages[selectedTab - 1]?.color === 'red' &&
                    'text-red-500 font-bold'
                  }`}
                >
                  {messages[selectedTab - 1].description}
                </p>
              </div>
            </div>
          ),
          {
            duration: 5000,
            position: 'bottom-right',
            id: 'tab' + selectedTab,
          },
        );
      }

      return () => {
        toast.dismiss('tab' + selectedTab);
      };
    }
  }, [selectedTab, loadingBoard]);

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

  function arraysAreEqual(arr1: any, arr2: any) {
    if (arr1.length !== arr2.length) {
      return false;
    }
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) {
        return false;
      }
    }
    return true;
  }

  function createTask(content: Comment) {
    const updatedTasks = [content, ...tasks];

    setTasks(updatedTasks);
  }

  function deleteTask(id: Id) {
    const newTasks = tasks.filter((task) => task.id !== id);
    setTasks(newTasks);
  }

  function detatchTask(content: Comment) {
    const group = groups.find((item) => item.id === content.group);

    if (group) {
      const commentIndex = group.comments.findIndex(
        (comment) => comment.id === content.id,
      );

      if (commentIndex !== -1) {
        group.comments.splice(commentIndex, 1);
        content.group = '';
      }
    }
  }

  function detatchAllTask(groupId: Id) {
    const group = groups.find((item) => item.id === groupId);

    let oldTasks = tasks;

    if (group) {
      for (const comment of group.comments) {
        comment.group = '';
        comment.status = group.status;
        const updatedTasks = [comment, ...oldTasks];
        oldTasks = updatedTasks;
      }
    }
  }

  function updateTask(id: string, content: Comment) {
    // Update tasks state immediately for vote calculation
    const updatedTasks = tasks.map((task) => {
      if (task.id === id) {
        return content;
      }
      return task;
    });
    setTasks(updatedTasks);
    
    // Update groups if the task is in a group
    if (content.group !== '') {
      const groupId = content.group as string;
      const commentId = content.id as string;

      const groupIndex = groups.findIndex((item) => item.id === groupId);
      if (groupIndex !== -1) {
        const commentIndex = groups[groupIndex].comments.findIndex(
          (item) => item.id === commentId,
        );
        if (commentIndex !== -1) {
          const updatedGroups = [...groups];
          updatedGroups[groupIndex].comments[commentIndex] = content;
          setGroups(updatedGroups);
        }
      }
    }
    
    // Also check if the content is actually a group (for GroupCard voting)
    const contentAsAny = content as any;
    if (contentAsAny.voters && contentAsAny.comments) {
      // This might be a group update
      const updatedGroups = groups.map((group) => {
        if (group.id === id) {
          return contentAsAny;
        }
        return group;
      });
      setGroups(updatedGroups);
    }
  }

  function createGroup(content: Group) {
    const updatedGroups = [content, ...groups];
    setGroups(updatedGroups);
  }

  function updateGroups(id: string, content: Group) {
    const newGroups = groups.map((group) => {
      if (group.id === id) {
        return content;
      }
      return group;
    });
    setGroups(newGroups);
  }

  function hideGroupTasks(id: Id, group: string) {
    const newTasks = tasks.map((task) => {
      if (task.id === id) {
        task.group = group;
      }
      return task;
    });

    setTasks(newTasks);
  }

  function redirectToRemovedPage(id: string, organizationId: string) {
    router.push(`/board/${id}/removed?organization=${organizationId}`);
  }

  const onUpdateBoardSettings = useCallback(
    (type: string, value: any, from: string) => {
      void (async () => {
        try {
          const promise = updateBoardSettings(
            organizationId,
            retrospectiveId,
            type,
            value,
          );

          if (type === 'authors') {
            if (value) {
              await toaster.promise(promise, {
                loading: 'Updating settings',
                success: 'Show author comments',
                error: 'Error updating settings',
              });
            } else {
              await toaster.promise(promise, {
                loading: 'Updating settings',
                success: 'Hide author comments',
                error: 'Error updating settings',
              });
            }
          } else if (type === 'votes') {
            await toaster.promise(promise, {
              loading: 'Updating vote settings',
              success: 'Vote settings updated',
              error: 'Error updating vote settings',
            });
          } else {
            await toaster.promise(promise, {
              loading: 'Updating settings',
              success: 'Settings has been updated',
              error: 'Error updating settings',
            });
          }

          if (from === 'modal' && type == 'votes') {
            setShowSettingsModal(false);
          }
          fetchBoard();
        } catch (e) {
          console.error(e);
        }
      })();
    },
    [updateBoardSettings, organizationId, retrospectiveId, fetchBoard],
  );

  // STAGE REDIRECTION
  useEffect(() => {
    if (retrospective && retrospective.members) {
      if (retrospective.members[userId]) {
        if (retrospective.status) {
          const hasAiGrouped = groups.some((group: any) => group.aiGroup);

          if (hasAiGrouped) {
            setSelectedTab(2);
          } else {
            setSelectedTab(retrospective.status);
          }
        } else {
          setSelectedTab(1);
        }
      }
    }
  }, [retrospective]);

  // REDIRECT TO ACTIONS STAGE
  useEffect(() => {
    if (!loadingGroups && groups && retrospective?.members?.[userId]) {
      if (retrospective.status) {
        const hasAiGrouped = groups.some((group: any) => group.aiGroup);
        const url = window.location.href;
        const isActionsStage = /#actions/.test(url);

        if (isActionsStage) {
          if (hasAiGrouped && selectedTab !== 2) {
            setSelectedTab(2);
          } else if (!hasAiGrouped && selectedTab !== 4 && !hasRedirected) {
            setSelectedTab(4);
            setHasRedirected(true);
          }
        }
      }
    }
  }, [retrospective, groups, loadingGroups, userId, selectedTab]);

  //AI GROUPING FUNCTIONS

  type GroupRefType = {
    onRegenerateAIButtonHandler: () => void;
  };

  const groupRef = useRef<GroupRefType>(null);

  const handleRegenerateAIClick = () => {
    if (groupRef.current) {
      groupRef.current.onRegenerateAIButtonHandler();
    }
  };

  const updateMemberStatus = useUpdateStatusBoardMember();

  const onUpdateRoleMemberRequested = useCallback(
    (type: string, value: any) => {
      void (async () => {
        try {
          const promise = updateMemberStatus(
            organizationId,
            teamId,
            retrospectiveId,
            userId,
            type,
            value,
          ).then(() => {
            fetchBoard();
          });

          if (type !== 'status' && type != 'href') {
            await toaster.promise(promise, {
              loading: 'Updating status member',
              success: 'Member status has been updated',
              error: 'Error updating status member',
            });
          }
        } catch (e) {
          console.error(e);
        }
      })();
    },
    [
      updateMemberStatus,
      organizationId,
      retrospectiveId,
      teamId,
      userId,
      fetchBoard,
    ],
  );

  if (loadingBoard) {
    return <PageLoadingIndicator>Loading board...</PageLoadingIndicator>;
  }

  return (
    <Layout>
      <div className="bg-white relative" id="board-container">
        <BoardHeader
          showMembersSidebar={showMembersSidebar}
          setShowMembersSidebar={setShowMembersSidebar}
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
          retrospective={retrospectiveData}
          fetchBoard={fetchBoard}
          requests={allBoardRequests}
          members={members}
          acceptMemberToBoard={acceptMemberToBoard}
          minute={minute}
          setMinute={setMinute}
          second={second}
          setSecond={setSecond}
          sound={sound}
          setSound={setSound}
          setPlay={setPlay}
          setPause={setPause}
          currentUserRole={currentUserRole}
          onUpdateBoardSettings={onUpdateBoardSettings}
          voteNumber={settingsVotes}
          setVoteNumber={setSettingsVotes}
          totalVotes={totalVotes}
          organizationId={organizationId}
          auth={auth}
          aiRemaining={aiRemaining}
          organization={organization}
          onUpdateIcebreakerRequested={onUpdateRoleMemberRequested}
          groups={groups}
          teamId={teamId}
        ></BoardHeader>
        {selectedTab !== 0 && (
          <Header
            setShowSettingsModal={setShowSettingsModal}
            showSettingsModal={showSettingsModal}
            selectedTab={selectedTab}
            retrospective={retrospectiveData}
            currentUserRole={currentUserRole}
            voteNumber={voteNumber}
            fetchBoard={fetchBoard}
            organizationId={organizationId}
            teamId={teamId}
            retrospectiveId={retrospectiveId}
            userId={userId}
            isAnonymous={currentUser?.isAnonymous || !currentUser?.email}
            aiRemaining={aiRemaining}
            canUseAI={canGroupAI}
            handleRegenerateAIClick={handleRegenerateAIClick}
            comments={tasks}
            groups={groups}
            onUpdateRoleMemberRequested={onUpdateRoleMemberRequested}
          />
        )}
      </div>
      <div>
        {selectedTab === 1 && !loadingBoard ? (
          <Content
            retrospective={retrospectiveData}
            teamMembers={teamMembers}
            organizationId={organizationId}
            teamId={teamId}
            retrospectiveId={retrospectiveId}
            comments={tasks}
            groups={groups}
            createTask={createTask}
            updateTask={updateTask}
            deleteTask={deleteTask}
            detatchTask={detatchTask}
            detatchAllTask={detatchAllTask}
            structure={retrospectiveData.structure}
            tags={tags}
            currentUser={currentUser}
            onUpdateGroup={onUpdateGroup}
            setGroups={setGroups}
            updateGroups={updateGroups}
            currentUserRole={currentUserRole}
            numberVotes={retrospective?.votes}
            rules={rules}
            voteNumber={voteNumber}
          />
        ) : selectedTab === 2 ? (
          <GroupPage
            setIsProcessing={setIsProcessing}
            groups={groups}
            setGroups={setGroups}
            tags={tags}
            comments={tasks}
            updateTask={updateTask}
            deleteTask={deleteTask}
            detatchTask={detatchTask}
            detatchAllTask={detatchAllTask}
            createGroup={createGroup}
            hideGroupTasks={hideGroupTasks}
            loading={loadingBoard}
            onUpdateGroup={onUpdateGroup}
            updateGroups={updateGroups}
            rules={rules}
            currentUserRole={currentUserRole}
            numberVotes={retrospective?.votes}
            teamMembers={teamMembers}
            retrospective={retrospectiveData}
            ref={groupRef}
            allComments={allComments}
            createTask={createTask}
            aiRemaining={aiRemaining}
          />
        ) : selectedTab === 3 ? (
          <VotePage
            groups={groups}
            setGroups={setGroups}
            tags={tags}
            comments={tasks}
            updateTask={updateTask}
            deleteTask={deleteTask}
            detatchTask={detatchTask}
            detatchAllTask={detatchAllTask}
            createGroup={createGroup}
            hideGroupTasks={hideGroupTasks}
            loading={loadingBoard}
            onUpdateGroup={onUpdateGroup}
            updateGroups={updateGroups}
            rules={rules}
            currentUserRole={currentUserRole}
            numberVotes={retrospective?.votes}
            showSettingsModal={showSettingsModal}
            setShowSettingsModal={setShowSettingsModal}
            onUpdateBoardSettings={onUpdateBoardSettings}
            voterNumber={voteNumber}
            setVoteNumber={setVoteNumber}
            teamMembers={teamMembers}
            settingVotes={settingsVotes}
            setSettingVotes={setSettingsVotes}
            retrospective={retrospectiveData}
            userId={userId}
            totalVotes={voteNumber}
            createTask={createTask}
          />
        ) : (
          selectedTab === 4 && (
            <ActionsPage
              groups={groups}
              setGroups={setGroups}
              tags={tags}
              comments={tasks}
              updateTask={updateTask}
              deleteTask={deleteTask}
              detatchTask={detatchTask}
              detatchAllTask={detatchAllTask}
              createGroup={createGroup}
              hideGroupTasks={hideGroupTasks}
              onUpdateGroup={onUpdateGroup}
              rules={rules}
              currentUserRole={currentUserRole}
              numberVotes={retrospective?.votes}
              showSettingsModal={showSettingsModal}
              setShowSettingsModal={setShowSettingsModal}
              onUpdateBoardSettings={onUpdateBoardSettings}
              voterNumber={voteNumber}
              setVoteNumber={setVoteNumber}
              restrictions={restrictions}
              retrospective={retrospectiveData}
              aiRemaining={aiRemaining}
              allComments={allComments}
              canUseAI={canUseAI}
              createTask={createTask}
              organizationData={organization}
            />
          )
        )}
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
    </Layout>
  );
}

function Header({
  selectedTab,
  retrospective,
  setShowSettingsModal,
  showSettingsModal,
  currentUserRole,
  fetchBoard,
  voteNumber,
  organizationId,
  teamId,
  retrospectiveId,
  userId,
  isAnonymous,
  aiRemaining,
  canUseAI,
  handleRegenerateAIClick,
  comments,
  groups,
  onUpdateRoleMemberRequested,
}: HeaderProps) {
  const accessType = retrospective?.access?.type;

  const router = useRouter();
  const [members, setMembers] = useState(0);
  const [memberVotes, setMemberVotes] = useState(0);
  const [memberCapture, setMemberCapture] = useState(0);

  const { trigger: endRetrospective, isMutating } = useEndRetrospective(
    organizationId,
    teamId,
    retrospectiveId,
  );

  const countMembersWithVoteDoneTrue = () => {
    let count = 0;
    for (const memberId in retrospective.members) {
      if (retrospective.members[memberId].voteDone === true) {
        count++;
      }
    }
    return count;
  };

  const countMembersWithCaptureDoneTrue = () => {
    let count = 0;
    for (const memberId in retrospective.members) {
      if (retrospective.members[memberId].captureDone === true) {
        count++;
      }
    }
    return count;
  };

  const [isChecked, setIsChecked] = useState(false);
  const [isCheckedVote, setIsCheckedVote] = useState(false);

  useEffect(() => {
    if (retrospective && retrospective.members) {
      const members = Object.keys(retrospective.members);
      setMembers(members.length);
      if (retrospective.members[userId]) {
        setIsChecked(retrospective.members[userId].captureDone);
        setIsCheckedVote(retrospective.members[userId].voteDone);
        const votes = countMembersWithVoteDoneTrue();
        setMemberVotes(votes);

        const votesCapture = countMembersWithCaptureDoneTrue();
        setMemberCapture(votesCapture);
      }
    }
  }, [retrospective]);

  const handleCheckboxChange = (e: any) => {
    setIsChecked(e.target.checked);
    onUpdateRoleMemberRequested('captureDone', e.target.checked);
  };

  const handleCheckboxChangeVote = (e: any) => {
    setIsCheckedVote(e.target.checked);
    onUpdateRoleMemberRequested('voteDone', e.target.checked);
  };

  const onEndRetrospectiveRequested = useCallback(() => {
    void (async () => {
      try {
        const promise = endRetrospective().then((res: any) => {
          if (res.success) {
            onUpdateRoleMemberRequested('href', `/results/${retrospectiveId}`);
            // router.push(`/results/${retrospectiveId}`);
          }
        });
        await toaster.promise(promise, {
          loading: 'Finishing retrospective',
          success: 'Retrospective has been finished',
          error: 'Error finishing retrospective',
        });
      } catch (e) {
        console.error(e);
      }
    })();
  }, [endRetrospective, retrospectiveId, onUpdateRoleMemberRequested]);

  useEffect(() => {
    if (
      retrospective.href &&
      retrospectiveId &&
      retrospective.href !== `/board/${retrospectiveId}` &&
      router.asPath !== retrospective.href
    ) {
      router.replace(retrospective.href as string);
    }
  }, [retrospective.href, retrospectiveId, router.asPath]);

  const showRestrospectiveButton =
    !retrospective?.finished && currentUserRole === MembershipRole.Facilitator;

  return (
    <div
      id="board-container"
      className={`md:grid relative space-y-4 md:space-y-0 px-4 pb-2 border-b border-[#E4E4E7] ${
        selectedTab === 3
          ? 'grid-cols-3'
          : selectedTab === 2
          ? 'grid-cols-3'
          : selectedTab === 4 && retrospective.finished
          ? 'grid-cols-1 justify-end'
          : 'grid-cols-2'
      }`}
    >
      <If condition={selectedTab === 1}>
        <div
          className={`flex px-3.5 py-2 w-fit rounded-md space-x-3 items-center ${
            isChecked ? 'bg-green-100' : 'bg-[#F4F4F5]'
          }`}
        >
          <p className="text-sm">
            {memberCapture} of {members} member done
          </p>
          <div className="w-px h-5 bg-[#E4E4E7]"></div>
          <div className="flex items-center justify-center">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                onChange={handleCheckboxChange}
                value="currentUser"
                className="sr-only peer"
                checked={isChecked}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              <span className="ml-3 text-sm font-medium text-zinc-600">
                I&apos;m done
              </span>
            </label>
          </div>
        </div>
      </If>
      <If condition={selectedTab === 2}>
        <div></div>
        {canUseAI &&
        currentUserRole === MembershipRole.Admin &&
        retrospective.groupWithAI ? (
          <div className="flex justify-center">
            <RegenerateAiButton
              aiRemaining={aiRemaining}
              onAction={handleRegenerateAIClick}
              disabled={comments?.length < 2 && groups.length === 0}
            />
          </div>
        ) : (
          <div></div>
        )}
      </If>
      <If condition={selectedTab === 3}>
        <div
          className={`flex w-fit px-3.5 py-2 rounded-md space-x-3 items-center ${
            isCheckedVote ? 'bg-green-100' : 'bg-[#F4F4F5]'
          }`}
        >
          <p className="text-sm">
            {memberVotes} of {members} member done
          </p>
          <div className="w-px h-5 bg-[#E4E4E7]"></div>
          <div className="flex items-center justify-center">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                onChange={handleCheckboxChangeVote}
                value="currentUser"
                className="sr-only peer"
                checked={isCheckedVote}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              <span className="ml-3 text-sm font-medium text-zinc-600">
                I&apos;m done
              </span>
            </label>
          </div>
        </div>
      </If>
      <If condition={selectedTab === 4}>
        {showRestrospectiveButton ? (
          <button
            onClick={onEndRetrospectiveRequested}
            className="flex w-fit bg-[#EF4444] px-4 py-2 text-white rounded-md space-x-3 items-center mx-auto md:mx-0"
          >
            Generate Report
          </button>
        ) : (
          <div />
        )}
      </If>
      <If condition={selectedTab === 3}>
        <div className="hidden m-auto md:flex items-center">
          <div className="flex items-center bg-orange-100 px-3.5 py-2 rounded-lg space-x-2">
            <p className="text-sm">Your vote </p>
            <p className="text-xl font-medium">
              {voteNumber}/{retrospective.votes}
            </p>
            <If condition={currentUserRole === MembershipRole.Facilitator}>
              <>
                <div className="w-px h-5 bg-[#09090B80]"></div>
                <Tooltip>
                  <TooltipContent>Click to Edit Vote</TooltipContent>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setShowSettingsModal(!showSettingsModal)}
                    >
                      <Image
                        className="h-4 w-4"
                        alt="settings"
                        src={settings}
                      />
                    </button>
                  </TooltipTrigger>
                </Tooltip>
              </>
            </If>
          </div>
        </div>
      </If>
      <div className="hidden md:flex justify-end">
        <If condition={retrospective?.locked}>
          <div className="my-auto flex items-center h-9 bg-red-100 px-3.5 py-2 rounded-lg space-x-2">
            <Image alt="lock" src={lock} />
            <p className="text-sm">Board is locked</p>
          </div>
        </If>
        <>
          {accessType === 'private' || accessType === 'team' ? (
            <div className="my-auto flex bg-blue-100 h-9 px-3.5 py-2 rounded-lg space-x-2">
              <Image alt="eye" src={eye} />
              <p className="text-sm">Private</p>
            </div>
          ) : (
            <div className="my-auto flex bg-blue-100 h-9 px-3.5 py-2 rounded-lg space-x-2">
              <Image alt="eye" src={eyeOn} />
              <p className="text-sm">Public</p>
            </div>
          )}
        </>
      </div>
    </div>
  );
}

function Content({
  organizationId,
  teamId,
  retrospectiveId,
  comments,
  groups,
  updateTask,
  deleteTask,
  detatchTask,
  detatchAllTask,
  createTask,
  teamMembers,
  structure,
  retrospective,
  tags,
  currentUser,
  onUpdateGroup,
  setGroups,
  updateGroups,
  currentUserRole,
  numberVotes,
  rules,
  voteNumber,
}: CaptureContentProps) {
  // Calculate maxVotesGlobal from retrospective
  const maxVotesGlobal = retrospective?.votes || 0;
  
  return (
    <div>
      <Board
        teamMembers={teamMembers}
        comments={comments}
        groups={groups}
        numberVotes={numberVotes}
        organizationId={organizationId}
        retrospectiveId={retrospectiveId}
        teamId={teamId}
        updateTask={updateTask}
        deleteTask={deleteTask}
        detatchTask={detatchTask}
        detatchAllTask={detatchAllTask}
        tasks={comments}
        structure={structure}
        retrospective={retrospective}
        tags={tags}
        currentUser={currentUser}
        onUpdateGroup={onUpdateGroup}
        setGroups={setGroups}
        updateGroups={updateGroups}
        currentUserRole={currentUserRole}
        createTask={createTask}
        rules={rules}
        myTotalVotes={voteNumber}
        maxVotesGlobal={maxVotesGlobal}
      ></Board>
    </div>
  );
}
