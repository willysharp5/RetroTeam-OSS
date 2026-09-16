import { useState, useEffect, useCallback, useRef } from 'react';

import {
  ActionContentProps,
  ActionPageProps,
  ColumnTabProps,
  Comment,
  Group,
} from '~/lib/board/types/types';
import { useCurrentOrganization } from '~/lib/organizations/hooks/use-current-organization';

import Board from '~/components/board/ActionsPage/board/Board';
import { Id, Task } from '~/lib/actions/types/actions';

import { useRouter } from 'next/router';
import { useAuth } from 'reactfire';
import Image from 'next/image';

import chat from '/public/assets/svg/chat-bubble.svg';
import thumbsUp from '/public/assets/svg/thumbs-up.svg';
import { Structure } from '~/lib/structures/types/structures';
import useFetchActions from '~/lib/server/board/get-actions';
import { useFetchBoardMembersMetadata } from '~/lib/board/hooks/use-fetch-board-members-metadata';

import { useUpdateRetrospectiveAIActions } from '~/lib/organizations/hooks/use-update-retrospective-ai-actions';
import WordCounterErrorModal from '~/components/shared/wordCountErrorModal';
import useFetchRules from '~/lib/server/rules/get-rules';
import { MembershipRole } from '~/lib/organizations/types/membership-role';
import isMobile from '~/components/utils/deviceDetecter';
import If from '~/core/ui/If';
import { useUpdateRetrospectiveSettings } from '~/lib/retrospectives/hooks/use-update-retrospective-settings';
import useGetAiActions from '~/lib/ai/use-get-actions';

export default function ActionPage({
  tags,
  groups,
  setGroups,
  comments,
  updateTask,
  deleteTask,
  detatchTask,
  detatchAllTask,
  createGroup,
  hideGroupTasks,
  onUpdateGroup,
  rules,
  currentUserRole,
  numberVotes,
  showSettingsModal,
  setShowSettingsModal,
  onUpdateBoardSettings,
  voterNumber,
  setVoteNumber,
  restrictions,
  retrospective,
  aiRemaining,
  allComments,
  canUseAI,
  createTask,
  organizationData
}: ActionPageProps) {
  const organization = useCurrentOrganization();
  const organizationId = organization?.id as string;
  const subscriptionId = organization?.subscription?.priceId as string;

  const router = useRouter();
  const { id } = router.query;
  const retrospectiveId = id as string;

  const auth = useAuth();
  const currentUser = auth.currentUser;

  const teamId = retrospective?.teamId as string;

  const { data: actionsData } = useFetchActions(
    organizationId,
    teamId,
    retrospectiveId,
  );

  const { data: aiRules } = useFetchRules('ai');

  const {
    data: boardMembers,
    loading: loadingMembers,
    error,
    searchMembers,
    loadingSearch,
  } = useFetchBoardMembersMetadata(organizationId, retrospectiveId, 3);

  const [updateRetrospectiveAIActions] = useUpdateRetrospectiveAIActions();

  const [tasks, setTasks] = useState<Comment[]>([]);
  const [actions, setActions] = useState<Task[]>([]);
  const [retrospectiveData, setRetrospectiveData] = useState<any>([]);
  const [aiData, setAIData] = useState();
  const [loadingAI, setLoadingAI] = useState(false);
  const [hasDisplayedAI, setHasDisplayedAI] = useState(false);
  const [showAiWordError, setShowAiWordError] = useState(false);

  useEffect(() => {
    if (actionsData) {
      setActions(actionsData);
    }
  }, [actionsData]);

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

  const aiCanceled = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { trigger: getActionsAI } = useGetAiActions();

  const getAiActions = useCallback(async () => {
    if (aiCanceled.current) return;

    const isValidResponse = (response: any) => {
      if (typeof response === 'object' && response !== null) {
        if ('Ownership' in response) {
          return false;
        }
      }
      return true;
    };

    if (allComments.length > 0) {
      setLoadingAI(true);
      try {
        // Set a timeout to cancel the AI action after 5 minutes (300000 ms)
        timeoutRef.current = setTimeout(() => {
          aiCanceled.current = true;
          setLoadingAI(false);
          console.error('AI action timed out');
        }, 300000);

        if (aiCanceled.current) return; // Check again before making the request

        const r = (await getActionsAI({
          allComments: allComments,
          retrospectiveData: retrospectiveData,
          totalAiTokens: aiRules.totalAiTokens,
        })) as any;

        const response = r.data;

        if (aiCanceled.current) return; // Check again after the request
        if (isValidResponse(response) && !r.error) {
          const responseData =
            response[0].actionItems ||
            response[0].ActionItems ||
            response[0].Actions;
          if (responseData) {
            if (aiCanceled.current) return; // Check again after the request
            setAIData(responseData);
            setHasDisplayedAI(true);
            updateRetrospectiveAIActions(
              organizationId,
              retrospectiveId,
              responseData,
            );
          }
          setLoadingAI(false);
        } else {
          console.error(r);
          setLoadingAI(false);
          setHasDisplayedAI(true);
          if (r.error) {
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
    } else {
      setHasDisplayedAI(true);
      setLoadingAI(false);
    }
  }, [
    allComments,
    retrospectiveData,
    organizationId,
    retrospectiveId,
    updateRetrospectiveAIActions,
    aiCanceled,
    aiRules,
    getActionsAI,
  ]);

  const onCancelAI = () => {
    setLoadingAI(false);
    aiCanceled.current = true;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const onRegenerateAI = () => {
    aiCanceled.current = false;
    getAiActions();
  };

  useEffect(() => {
    if (
      !hasDisplayedAI &&
      retrospectiveData.actionsWithAI &&
      allComments &&
      retrospectiveData &&
      aiRemaining > 0
    ) {
      if (retrospectiveData.aiActions) {
        setAIData(retrospectiveData.aiActions);
        setHasDisplayedAI(true);
        setLoadingAI(false);
      } else if (currentUserRole === MembershipRole.Admin) {
        getAiActions();
        setHasDisplayedAI(true);
      }
    }
  }, [allComments, retrospectiveData, hasDisplayedAI, currentUserRole]);

  useEffect(() => {
    if (comments) {
      setTasks(comments);
    }
  }, [comments]);

  useEffect(() => {
    if (retrospective) setRetrospectiveData(retrospective);
  }, [retrospective]);

  function addCommentGroup(id: any, comment: Comment) {
    const groupIndex = groups.findIndex((item) => item.id === id);

    if (groupIndex !== -1) {
      groups[groupIndex].comments = groups[groupIndex].comments || [];
      groups[groupIndex].comments.push(comment);
    } else {
      console.error(`Group doesnt exist ${id}`);
    }
  }

  return (
    <Content
      retrospective={retrospective}
      teamMembers={boardMembers}
      organizationId={organizationId}
      remaining={aiRemaining}
      teamId={teamId}
      retrospectiveId={retrospectiveId}
      tasks={tasks}
      groups={groups}
      data={tasks}
      actions={actions}
      setGroups={setGroups}
      setActions={setActions}
      updateTask={updateTask}
      deleteTask={deleteTask}
      detatchTask={detatchTask}
      detatchAllTask={detatchAllTask}
      createGroup={createGroup}
      addCommentGroup={addCommentGroup}
      hideGroupTasks={hideGroupTasks}
      createAction={createAction}
      updateAction={updateAction}
      archiveAction={archiveAction}
      deleteAction={deleteAction}
      structure={retrospectiveData.structure}
      tags={tags}
      currentUser={currentUser}
      onUpdateGroup={onUpdateGroup}
      rules={rules}
      currentUserRole={currentUserRole}
      numberVotes={numberVotes}
      showSettingsModal={showSettingsModal}
      setShowSettingsModal={setShowSettingsModal}
      onUpdateBoardSettings={onUpdateBoardSettings}
      voteNumber={voterNumber}
      setVoteNumber={setVoteNumber}
      subscriptionId={subscriptionId}
      refetchTeamMembers={searchMembers}
      loadingMembers={loadingSearch}
      aiData={aiData}
      getAiActions={onRegenerateAI}
      restrictions={restrictions}
      loadingAI={loadingAI}
      showAiWordError={showAiWordError}
      setShowAiWordError={setShowAiWordError}
      onCancelAI={onCancelAI}
      canUseAI={canUseAI}
      createTask={createTask}
      organizationData={organizationData}
    />
  );
}

function Content({
  organizationId,
  teamId,
  retrospectiveId,
  tasks,
  groups,
  data,
  updateTask,
  deleteTask,
  detatchTask,
  detatchAllTask,
  createGroup,
  addCommentGroup,
  hideGroupTasks,
  setActions,
  createAction,
  updateAction,
  archiveAction,
  deleteAction,
  teamMembers,
  structure,
  retrospective,
  tags,
  setGroups,
  currentUser,
  onUpdateGroup,
  rules,
  currentUserRole,
  showSettingsModal,
  setShowSettingsModal,
  onUpdateBoardSettings,
  voteNumber,
  setVoteNumber,
  actions,
  subscriptionId,
  refetchTeamMembers,
  loadingMembers,
  aiData,
  remaining,
  getAiActions,
  restrictions,
  loadingAI,
  showAiWordError,
  setShowAiWordError,
  onCancelAI,
  canUseAI,
  createTask,
  organizationData
}: ActionContentProps) {
  const isScreenMobile = isMobile();

  const [numberVotes, setNumberVotes] = useState(5);
  const [selectedColumns, setSelectedColumns] = useState<Structure[]>([]);
  const [showCard, setShowCard] = useState('');

  useEffect(() => {
    if (retrospective && typeof retrospective.votes === 'number') {
      setNumberVotes(retrospective.votes);
    }
  }, [retrospective]);

  useEffect(() => {
    if (retrospective.selectedColumns) {
      setSelectedColumns(retrospective.selectedColumns);
    }
  }, [retrospective]);

  return (
    <div
      style={{
        height: !isScreenMobile ? '-webkit-fill-available' : 'auto',
      }}
      className={`flex px-8 py-6 tv:px-36 ${
        !isScreenMobile && 'xl:absolute'
      } bg-gray-100  xl:h-[85%] tv:h-[90%] justify-start overflow-auto w-full items-start gap-2 lg:gap-20 py-3 px-4`}
    >
      <WordCounterErrorModal
        showModal={showAiWordError}
        setShowModal={setShowAiWordError}
        message="This data is too large for our AI to Analyze"
      />
      <div className="space-y-4">
        {structure?.map((column, index) => {
          column.order = index;
          return (
            <ColumnTab
              organizationId={organizationId}
              retrospective={retrospective}
              index={index}
              key={index}
              column={column}
              comments={data.filter(
                (task: Comment) => task.status === column.id,
              )}
              groups={groups?.filter(
                (task: Group) => task.status === column.id,
              )}
              selectedColumns={selectedColumns}
              currentUserRole={currentUserRole}
            />
          );
        })}
      </div>
      <Board
        numberVotes={numberVotes}
        setNumberVotes={setNumberVotes}
        comments={data}
        organizationId={organizationId}
        retrospectiveId={retrospectiveId}
        teamId={teamId}
        teamMembers={teamMembers}
        updateTask={updateTask}
        deleteTask={deleteTask}
        detatchTask={detatchTask}
        detatchAllTask={detatchAllTask}
        createGroup={createGroup}
        addCommentGroup={addCommentGroup}
        hideGroupTasks={hideGroupTasks}
        setGroups={setGroups}
        setActions={setActions}
        createAction={createAction}
        updateAction={updateAction}
        archiveAction={archiveAction}
        deleteAction={deleteAction}
        tasks={tasks}
        structure={selectedColumns}
        retrospective={retrospective}
        groups={groups}
        tags={tags}
        currentUser={currentUser}
        onUpdateGroup={onUpdateGroup}
        rules={rules}
        actions={actions}
        currentUserRole={currentUserRole}
        showSettingsModal={showSettingsModal}
        setShowSettingsModal={setShowSettingsModal}
        onUpdateBoardSettings={onUpdateBoardSettings}
        voteNumber={voteNumber}
        setVoteNumber={setVoteNumber}
        showCard={showCard}
        setShowCard={setShowCard}
        userId={currentUser.uid}
        subscriptionId={subscriptionId}
        refetchTeamMembers={refetchTeamMembers}
        loadingMembers={loadingMembers}
        aiData={aiData}
        remaining={remaining}
        getAiActions={getAiActions}
        restrictions={restrictions}
        loadingAI={loadingAI}
        onCancelAI={onCancelAI}
        canUseAI={canUseAI}
        createTask={createTask}
        organizationData={organizationData}
      ></Board>
    </div>
  );
}

function ColumnTab({
  organizationId,
  retrospective,
  column,
  comments,
  groups,
  index,
  selectedColumns,
  currentUserRole,
}: ColumnTabProps) {
  const [isChecked, setIsChecked] = useState<boolean>(
    retrospective?.selectedColumns
      ? retrospective.selectedColumns.some((item: any) => item.id === column.id)
      : index === 0,
  );

  const [totalVotes, setTotalVotes] = useState(0);
  const [total, setTotal] = useState(0);

  const updateRetrospectiveSettings = useUpdateRetrospectiveSettings();

  const onUpdateRetrospectiveSettings = useCallback(
    (value: any) => {
      void (async () => {
        try {
          const promise = updateRetrospectiveSettings(
            organizationId,
            retrospective.id,
            'selectedColumns',
            value,
            retrospective.name,
          );
        } catch (e) {
          console.error('Error on onUpdateRetrospectiveSettings', e);
        }
      })();
    },
    [updateRetrospectiveSettings, organizationId, retrospective],
  );

  useEffect(() => {
    let totalVotes = 0;
    let total = 0;
    if (comments.length > 0) {
      comments.forEach((item) => {
        totalVotes += item.votes;
      });

      total = comments.length;
    }
    if (groups && groups?.length > 0) {
      groups.forEach((item) => {
        totalVotes += item.votes;
      });
      total += groups.length;
    }
    setTotalVotes(totalVotes);
    setTotal(total);
  }, [comments, groups]);

  useEffect(() => {
    const selectedColumn = retrospective.selectedColumns
      ? retrospective.selectedColumns
      : selectedColumns;

    const columnExists = selectedColumn.some(
      (col: any) => col.id === column.id,
    );

    if (isChecked && !columnExists) {
      const updatedColumns = [...selectedColumn, column];
      updatedColumns.sort((a, b) => (a.order || 0) - (b.order || 0));
      onUpdateRetrospectiveSettings(updatedColumns);
    } else if (!isChecked && columnExists) {
      const updatedColumns = selectedColumn.filter(
        (col: Structure) => col.id !== column.id,
      );
      updatedColumns.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
      onUpdateRetrospectiveSettings(updatedColumns);
    }
  }, [isChecked]);

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsChecked(event.target.checked);
  };

  return (
    <div className="flex w-[400px] justify-between items-center bg-orange-500 text-white rounded-[5px] p-2.5 ">
      <div className="flex items-center space-x-2">
        <div className="inline-flex items-center">
          <label
            className="relative flex items-center rounded-full cursor-pointer"
            htmlFor="checkbox-1"
            data-ripple-dark="true"
          >
            <If condition={currentUserRole === MembershipRole.Facilitator}>
              <input
                checked={isChecked}
                type="checkbox"
                className="before:content[''] peer bg-white border border-black rounded-sm relative h-5 w-5 cursor-pointer appearance-none transition-all before:absolute before:top-2/4 before:left-2/4 before:block before:h-12 before:w-12 before:-translate-y-2/4 before:-translate-x-2/4 before:bg-blue-gray-500 before:opacity-0 before:transition-opacity checked:border-rose-700 checked:bg-rose-700 checked:before:bg-white"
                id="checkbox-1"
                onChange={handleCheckboxChange}
              />
            </If>

            <div className="absolute text-white transition-opacity opacity-0 pointer-events-none top-2/4 left-2/4 -translate-y-2/4 -translate-x-2/4 peer-checked:opacity-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <g id="check">
                  <path
                    id="Vector"
                    d="M13.3337 4L6.00033 11.3333L2.66699 8"
                    stroke="#FAFAFA"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              </svg>
            </div>
          </label>
        </div>
        <p className="text-2xl font-extrabold">{column.name}</p>
      </div>
      <div className="flex space-x-2.5">
        <div className="flex bg-[#F4F4F5] text-black px-4 py-2 space-x-2 rounded-md w-max">
          <Image src={thumbsUp} alt="thumbsUp" />
          <p>{totalVotes}</p>
        </div>
        <div className="flex bg-white text-black px-4 py-2 space-x-2 rounded-md w-max">
          <Image src={chat} alt="chat" />
          <p>{total}</p>
        </div>
      </div>
    </div>
  );
}
