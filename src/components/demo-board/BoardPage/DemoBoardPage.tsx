import { useState, useEffect, useCallback } from 'react';

import toast, { type Toast } from 'react-hot-toast';
import toaster from 'react-hot-toast';

import Image from 'next/image';

import lock from '/public/assets/svg/lock-closed.svg';
import eye from '/public/assets/svg/eye-closed.svg';
import eyeOn from '/public/assets/svg/eye-open.svg';
import settings from '/public/assets/svg/settings.svg';

import { Group, Comment, Tag } from '~/lib/board/types/types';
import { Id } from '~/lib/actions/types/actions';
import { TeamMembers } from '~/lib/teams/types/teams';
import useFetchRetroTeamTags from '~/lib/server/board/tags/get-tags';
import { MembershipRole } from '~/lib/organizations/types/membership-role';

import Board from '~/components/demo-board/BoardPage/board/Board';
import ActionsPage from '~/components/demo-board/ActionsPage/ActionsPage';

import GroupPage from '../GroupPage/GroupPage';
import VotePage from '../VotePage/VotePage';

import PageLoadingIndicator from '~/core/ui/PageLoadingIndicator';
import If from '~/core/ui/If';
import { Tooltip, TooltipTrigger, TooltipContent } from '~/core/ui/Tooltip';


import useFetchDemoComments from '~/lib/server/demo/get-demo-comments';
import { useGetDemoRetrospective } from '~/lib/server/demo/get-demo-retrospective';
import { useUserSession } from '~/core/hooks/use-user-session';
import DemoBoardHeader from '~/components/layouts/sidebar/DemoBoardHeader';
import useFetchDemoGroups from '~/lib/server/demo/get-demo-groups';
import { Retrospectives } from '~/lib/retrospectives/types/retrospectives';
import { Structure } from '~/lib/structures/types/structures';
import useUpdateDemoGroup from '~/lib/demo/hooks/use-update-demo-group';
import TimerModalDemo from '~/components/shared/timerSidebar/timerModalDemo';
import { useUpdateBoardDemoSettings } from '~/lib/demo/hooks/use-update-demo-retrospective';
import Link from 'next/link';
import configuration from '~/configuration';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import DemoLayout from '~/core/ui/DemoLayout';

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

export default function DemoBoardPage() {
  const userSession = useUserSession();
  const currentUser = userSession?.auth;
  
  const userId = 'user1@retroteam.ai';
  const isSuperAdmin = userSession?.data?.superAdmin as boolean;
  
  const currentUserRole = MembershipRole.Facilitator;

  const [selectedTab, setSelectedTab] = useState(1);

  const [loadingVotes, setLoadingVotes] = useState(true);

  // TIMER FUNCTIONS
  const [sound, setSound] = useState('');

  const [showPlayModal, setShowPlayModal] = useState(false);

  useEffect(() => {
    setMinute(5);
    setSecond(0);
    setPlay(false);
    setPause(true);
    setShowPlayModal(false);
  }, [selectedTab]);

  const { retrospective, members: boardMembers = [] } =
    useGetDemoRetrospective();

  const { data: tags, loading: loadingTags } = useFetchRetroTeamTags();

  const { trigger: updateGroup } = useUpdateDemoGroup();

  const allowViewAllComments = true;

  const { data, loading: loadingComments } = useFetchDemoComments(
    allowViewAllComments,
    userId,
    selectedTab,
  );

  const { data: groupData, loading: loadingGroups } = useFetchDemoGroups(
    allowViewAllComments,
    selectedTab,
  );

  const updateBoardSettings = useUpdateBoardDemoSettings();

  const [showMembersSidebar, setShowMembersSidebar] = useState(false);
  const [loadingRetrospective, setLoadingRetrospective] = useState(true);
  const [teamMembers, setTeamMembers] = useState([]);
  const [tasks, setTasks] = useState<Comment[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [retrospectiveData, setRetrospectiveData] = useState<any>([]);

  const [members, setMembers] = useState<TeamMembers[]>([]);

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

  const onUpdateGroup = async (group: Group, order: number, status: string) => {
    const body = {
      id: group.id,
      name: group.name,
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

  useEffect(() => {
    if (boardMembers && !arraysAreEqual(boardMembers, teamMembers)) {
      setTeamMembers(boardMembers);
    }
  }, [boardMembers, teamMembers]);

  // Set total votes
  useEffect(() => {
    setLoadingVotes(true);

    let totalVotes = 0;
    tasks.forEach((item: Comment) => {
      totalVotes += item.votes;
    });

    groups.forEach((item: Group) => {
      totalVotes += item.votes;
    });

    setTotalVotes(totalVotes);

    const timeout = setTimeout(() => {
      setLoadingVotes(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [tasks, groups]);

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

      if (group.comments.length === 0) {
        const newGroups = groups.filter((task) => task.id !== group.id);
        //  setGroups(newGroups);
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
        //  setTasks(updatedTasks);
      }
      const newGroups = groups.filter((task) => task.id !== groupId);
      // setGroups(newGroups);
    }
  }

  function updateTask(id: string, content: Comment) {
    const newTasks = tasks.map((task) => {
      if (task.id === id) {
        task = content;
      }
      return task;
    });

    // setTasks(newTasks);

    if (content.group !== '') {
      const groupId = content.group as string;
      const commentId = content.id as string;

      const groupIndex = groups.findIndex((item) => item.id === groupId);
      const commentIndex = groups[groupIndex].comments.findIndex(
        (item) => item.id === commentId,
      );

      groups[groupIndex].comments[commentIndex] = content;
    }
  }

  function createGroup(content: Group) {
    const updatedGroups = [content, ...groups];
    setGroups(updatedGroups);

    const newTasks = tasks.filter(
      (task) =>
        task.id !== content.comments[0].id &&
        task.id !== content.comments[1].id,
    );

    //  setTasks(newTasks);
  }

  function updateGroups(id: string, content: Group) {
    const newGroups = groups.map((group) => {
      if (group.id === id) {
        group = content;
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

  // Settings
  const [showAuthors, setShowAuthors] = useState(false);
  const [lockedBoard, setLockedBoard] = useState(false);
  const [accessType, setAccess] = useState('public');

  const onUpdateBoardSettings = useCallback(
    (type: string, value: any, from: string) => {
      void (async () => {
        try {
          const promise = updateBoardSettings(type, value, retrospective?.name);

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
        } catch (e) {
          console.error(e);
        }
      })();
    },
    [updateBoardSettings, retrospective],
  );

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

  if (loadingBoard) {
    return <PageLoadingIndicator>Loading demo...</PageLoadingIndicator>;
  }

  return (
    <DemoLayout>
      <div className="bg-white relative" id="board-container">
        <DemoBoardHeader
          showMembersSidebar={showMembersSidebar}
          setShowMembersSidebar={setShowMembersSidebar}
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
          retrospective={retrospectiveData}
          members={members}
          minute={minute}
          setMinute={setMinute}
          second={second}
          setSecond={setSecond}
          sound={sound}
          setSound={setSound}
          setPlay={setPlay}
          setPause={setPause}
          setShowPlayModal={setShowPlayModal}
          currentUserRole={currentUserRole}
          onUpdateBoardSettings={onUpdateBoardSettings}
          voteNumber={settingsVotes}
          setVoteNumber={setSettingsVotes}
          totalVotes={totalVotes}
          auth={currentUser}
          onUpdateIcebreakerRequested={() => {}}
          groups={groups}
          isSuperAdmin={isSuperAdmin}
          showAuthors={showAuthors}
          setShowAuthors={setShowAuthors}
          lockedBoard={lockedBoard}
          setLockedBoard={setLockedBoard}
          accessType={accessType}
          setAccessType={setAccess}
        ></DemoBoardHeader>
        {selectedTab !== 0 && (
          <Header
            setShowSettingsModal={setShowSettingsModal}
            showSettingsModal={showSettingsModal}
            selectedTab={selectedTab}
            retrospective={retrospectiveData}
            voteNumber={voteNumber}
            lockedBoard={lockedBoard}
            accessType={accessType}
          />
        )}
      </div>
      <div>
        {selectedTab === 1 && !loadingBoard ? (
          <Content
            retrospective={retrospectiveData}
            teamMembers={teamMembers}
            comments={tasks}
            groups={groups}
            createTask={createTask}
            updateTask={updateTask}
            deleteTask={deleteTask}
            detatchTask={detatchTask}
            detatchAllTask={detatchAllTask}
            structure={retrospectiveData.structure}
            tags={tags}
            showAuthors={showAuthors}
            onUpdateGroup={onUpdateGroup}
            numberVotes={retrospective?.votes}
            isSuperAdmin={isSuperAdmin}
          />
        ) : selectedTab === 2 ? (
          <GroupPage
            setIsProcessing={setIsProcessing}
            isProcessing={isProcessing}
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
            numberVotes={retrospective?.votes}
            teamMembers={teamMembers}
            retrospective={retrospectiveData}
            createTask={createTask}
            isSuperAdmin={isSuperAdmin}
            showAuthors={showAuthors}
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
            onUpdateGroup={onUpdateGroup}
            numberVotes={retrospective?.votes}
            showSettingsModal={showSettingsModal}
            setShowSettingsModal={setShowSettingsModal}
            onUpdateBoardSettings={onUpdateBoardSettings}
            voterNumber={voteNumber}
            settingVotes={settingsVotes}
            setSettingVotes={setSettingsVotes}
            retrospective={retrospectiveData}
            totalVotes={totalVotes}
            createTask={createTask}
            updateGroups={updateGroups}
            loadingVotes={loadingVotes}
            isSuperAdmin={isSuperAdmin}
            showAuthors={showAuthors}
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
              updateGroups={updateGroups}
              numberVotes={retrospective?.votes}
              showSettingsModal={showSettingsModal}
              setShowSettingsModal={setShowSettingsModal}
              onUpdateBoardSettings={onUpdateBoardSettings}
              voterNumber={voteNumber}
              setVoteNumber={setVoteNumber}
              retrospective={retrospectiveData}
              createTask={createTask}
              isSuperAdmin={isSuperAdmin}
              showAuthors={showAuthors}
            />
          )
        )}
      </div>

      <TimerModalDemo
        minute={minute}
        setMinute={setMinute}
        second={second}
        setSecond={setSecond}
        sound={sound}
        play={play}
        setPlay={setPlay}
        pause={pause}
        setPause={setPause}
        showPlayModal={showPlayModal}
        setShowPlayModal={setShowPlayModal}
      />
      <If condition={!currentUser}>
        <div className="fixed bottom-8 left-6">
          <Link
            href={configuration.paths.signIn}
            className="px-4 py-2 rounded-[5px] h-[70px] w-[240px] w-full mt-6 bg-[#DC2626] hover:bg-red-500 text-white text-sm flex justify-center items-center"
          >
            <div className="w-[27px] h-[27px]">
              <PlusCircleIcon />
            </div>

            <p className="ml-2 text-xl"> Sign up</p>
          </Link>
        </div>
      </If>
    </DemoLayout>
  );
}

interface HeaderProps {
  selectedTab: number;
  retrospective: Retrospectives;
  setShowSettingsModal: (show: boolean) => void;
  showSettingsModal: boolean;
  voteNumber: number;
  lockedBoard: boolean;
  accessType: string;
}

function Header({
  selectedTab,
  retrospective,
  setShowSettingsModal,
  showSettingsModal,
  voteNumber,
  lockedBoard,
  accessType,
}: HeaderProps) {
  const [members, setMembers] = useState(0);
  const [memberVotes, setMemberVotes] = useState(0);
  const [memberCapture, setMemberCapture] = useState(0);

  const [isChecked, setIsChecked] = useState(false);
  const [isCheckedVote, setIsCheckedVote] = useState(false);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsChecked(e.target.checked);

    setMemberCapture((prev) => (e.target.checked ? prev + 1 : prev - 1));
  };

  const handleCheckboxChangeVote = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsCheckedVote(e.target.checked);

    setMemberVotes((prev) => (e.target.checked ? prev + 1 : prev - 1));
  };

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

  useEffect(() => {
    if (retrospective && retrospective.members) {
      const members = Object.keys(retrospective.members);
      setMembers(members.length);
      if (retrospective.members) {
        const votes = countMembersWithVoteDoneTrue();
        setMemberVotes(votes);

        const votesCapture = countMembersWithCaptureDoneTrue();
        setMemberCapture(votesCapture);
      }
    }
  }, [retrospective]);

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
        <div></div>
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
      <If condition={selectedTab === 3}>
        <div className="hidden m-auto md:flex items-center">
          <div className="flex items-center bg-orange-100 px-3.5 py-2 rounded-lg space-x-2">
            <p className="text-sm">Your vote </p>
            <p className="text-xl font-medium">
              {voteNumber}/{retrospective.votes}
            </p>
            <>
              <div className="w-px h-5 bg-[#09090B80]"></div>
              <Tooltip>
                <TooltipContent>Click to Edit Vote</TooltipContent>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowSettingsModal(!showSettingsModal)}
                  >
                    <Image className="h-4 w-4" alt="settings" src={settings} />
                  </button>
                </TooltipTrigger>
              </Tooltip>
            </>
          </div>
        </div>
      </If>
      <div className="hidden md:flex justify-end">
        <If condition={lockedBoard}>
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

interface CaptureContentProps {
  retrospective: Retrospectives;
  comments: any;
  groups: Group[];
  createTask: (Task: Comment) => void;
  updateTask: (id: string, content: Comment) => void;
  deleteTask: (id: string) => void;
  detatchTask: (content: Comment) => void;
  detatchAllTask: (groupId: Id) => void;
  onUpdateGroup: (group: Group, order: number, status: string) => void;
  teamMembers: TeamMembers[] | any[] | null;
  structure?: Structure[];
  tags: Tag[];
  numberVotes: number;
  isSuperAdmin: boolean;
  showAuthors: boolean;
}

function Content({
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
  onUpdateGroup,
  numberVotes,
  isSuperAdmin,
  showAuthors,
}: CaptureContentProps) {
  return (
    <div>
      <Board
        teamMembers={teamMembers}
        groups={groups}
        numberVotes={numberVotes}
        updateTask={updateTask}
        deleteTask={deleteTask}
        detatchTask={detatchTask}
        detatchAllTask={detatchAllTask}
        tasks={comments}
        structure={structure}
        retrospective={retrospective}
        tags={tags}
        onUpdateGroup={onUpdateGroup}
        createTask={createTask}
        isSuperAdmin={isSuperAdmin}
        totalVotes={0}
        showAuthors={showAuthors}
      ></Board>
    </div>
  );
}
