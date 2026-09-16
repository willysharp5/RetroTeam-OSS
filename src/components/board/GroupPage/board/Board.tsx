import { useCallback, useEffect, useRef, useState } from 'react';
import toaster from 'react-hot-toast';
import ColumnContainer from './ColumnContainer';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { createPortal } from 'react-dom';
import _ from 'lodash';
import TaskCard from '../../BoardPage/board/TaskCard';
import useUpdateComments from '~/lib/board/hooks/use-update-comments';
import { BoardColumn, Comment, Group, Tag } from '~/lib/board/types/types';
import { v4 as uuidv4 } from 'uuid';

import useCreateGroup from '~/lib/board/hooks/use-create-group';
import useUpdateGroup from '~/lib/board/hooks/use-update-group';
import useAddCommentGroup from '~/lib/board/hooks/use-add-comment-group';
import GroupCard from './GroupCard';
import AiLoader from '~/components/shared/aiLoader';
import WordCounterErrorModal from '~/components/shared/wordCountErrorModal';
import RegenerateConfirmationModal from '~/components/shared/confirmationModal';
import { Retrospectives } from '~/lib/retrospectives/types/retrospectives';
import { Id } from '~/lib/actions/types/actions';
import { TeamMembers } from '~/lib/teams/types/teams';
import { Structure } from '~/lib/structures/types/structures';
import { Rules } from '~/lib/rules/types';

import { MembershipRole } from '~/lib/organizations/types/membership-role';
import isMobile from '~/components/utils/deviceDetecter';

interface GroupBoard {
  organizationId: string;
  teamId: string;
  retrospectiveId: string;
  retrospective: Retrospectives;
  tasks: Comment[];
  setTasks: (task: any) => void;
  setGroups: (group: any) => void;
  detatchTask: (content: Comment) => void;
  deleteTask: (id: any) => void;
  createGroup: (group: Group) => void;
  hideGroupTasks: (id: string, id2: string) => void;
  updateTask: (id: string, content: Comment) => void;
  detatchAllTask: (groupId: Id) => void;
  teamMembers: any[] | TeamMembers[] | null;
  structure: Structure[] | undefined | any;
  groups: Group[] | any;
  tags: Tag[] | any;
  currentUser: any;
  onUpdateGroup: (group: Group, index: number, status: string) => void;
  updateGroups: (id: string, content: Group) => void;
  currentUserRole: number;
  numberVotes: number;
  rules: Rules;
  setShowAiWordError: any;
  showAiWordError: any;
  aiRules: Rules;
  setLoadingAI: any;
  aiCanceled: boolean;
  setAiCanceled: (canceled: boolean) => void;
  timeoutRef: any;
  groupCommentsAI: any;
  groupComments: any;
  loadingAI: boolean;
  setShowRegenerateWarning: any;
  onRegenerateGroupingAI: () => void;
  showRegenerateWarning: boolean;
  createTask: (task: Comment) => void;
  aiRemaining: number;
  setIsProcessing: (isProcessing: boolean) => void;
}

function Board({
  organizationId,
  teamId,
  retrospectiveId,
  retrospective,
  tasks,
  setTasks,
  setGroups,
  detatchTask,
  deleteTask,
  createGroup,
  hideGroupTasks,
  updateTask,
  detatchAllTask,
  teamMembers,
  structure,
  groups,
  tags,
  currentUser,
  onUpdateGroup,
  updateGroups,
  rules,
  currentUserRole,
  numberVotes,
  setShowAiWordError,
  showAiWordError,
  aiRules,
  setLoadingAI,
  aiCanceled,
  setAiCanceled,
  timeoutRef,
  groupCommentsAI,
  groupComments,
  loadingAI,
  setShowRegenerateWarning,
  onRegenerateGroupingAI,
  showRegenerateWarning,
  createTask,
  aiRemaining,
  setIsProcessing,
}: GroupBoard) {
  const isScreenMobile = isMobile();

  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    setIsProcessing(completedCount != 0);
  }, [completedCount]);

  const [columns, setColumns] = useState<BoardColumn[]>(structure);

  const [overTask, setOverTask] = useState('');
  const [overAGroup, setOverAGroup] = useState('');

  const { trigger: addGroupData } = useCreateGroup();
  const { trigger: updateGroupData } = useUpdateGroup();
  const { trigger: groupComment } = useAddCommentGroup();
  const { trigger: UpdateComments } = useUpdateComments();

  const [canUseAI, setCanUseAI] = useState(false);

  useEffect(() => {
    if (aiRules) {
      setCanUseAI(aiRules.groupingAI && aiRemaining > 0);
    }
  }, [aiRules, aiRemaining]);

  async function confirmAIGrouping(group: any) {
    const body = {
      id: group.id,
      name: group.name || 'Group Title',
      organizationId,
      retrospectiveId,
      comments: group.comments,
      status: group.status,
      order: group.order,
      aiGroup: false,
      votes: group.votes || 0,
      voters: group.voters || [],
      tags: group.tags,
    };
    const _groups = [...groups];
    const groupIndex = _groups.findIndex((item: any) => item.id === group.id);
    _groups[groupIndex] = { ...group, aiGroup: false };
    const promise = updateGroupData(body)
      .then((res: any) => {
        if (res.success) {
          // setGroups(_groups);
        }
      })
      .catch((e: any) => {
        console.error('ERROR confirmAIGrouping', e);
      });
    await toaster.promise(promise, {
      loading: 'Grouping comments',
      success: 'Comments has been grouped',
      error: 'Error grouping comments',
    });
  }

  const onCancelAI = () => {
    setLoadingAI(false);
    setAiCanceled(true);
    // Cancel AI on DB
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    if (structure) setColumns(structure);
  }, [structure]);

  // Group AI comments automactilly
  useEffect(() => {
    if (
      retrospective?.groupWithAI &&
      !retrospective?.aiGrouped &&
      !retrospective?.finished &&
      !aiCanceled &&
      tasks.length >= 2 &&
      currentUserRole === MembershipRole.Admin &&
      canUseAI
    ) {
      setLoadingAI(true);
      timeoutRef.current = setTimeout(async () => {
        const response = await groupCommentsAI();

        await groupComments(response?.groupingData);
        setTimeout(() => setLoadingAI(false), 4000);
      }, 3000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [retrospective]);

  const [activeTask, setActiveTask] = useState<Comment | null>(null);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
  );

  const onCreateGroup = async (
    id: string,
    comments: any[],
    status: string,
    voters: any,
    order: number,
    title?: string,
  ) => {
    const totalVotes = comments.reduce((total, item) => total + item.votes, 0);

    const body = {
      id: id,
      name: title ? title : 'Group Title',
      organizationId,
      retrospectiveId,
      comments,
      status,
      order,
      votes: totalVotes,
      voters,
      aiGroup: false,
    };
    try {
      const promise = addGroupData(body);
      await toaster.promise(promise, {
        loading: 'Grouping comments',
        success: 'Comments have been grouped',
        error: 'Error grouping comments',
      });

      const res = await promise;
    } catch (e) {
      console.error('ERROR onCreateGroup', e);
    }
  };

  const onAddTaskGroup = async (
    id: string,
    commentId: string,
    status: string,
    votes: number,
    voters: any,
  ) => {
    const body = {
      id,
      organizationId,
      retrospectiveId,
      commentId,
      status,
      votes,
      voters,
    };

    const promise = groupComment(body)
      .then((res: any) => {
        if (res.success) {
        }
      })
      .catch((e: any) => {
        console.error('ERROR onAddTaskGroup', e);
      });
    await toaster.promise(promise, {
      loading: 'Grouping comments',
      success: 'Comments has been grouped',
      error: 'Error grouping comments',
    });
  };

  const UpdateComment = async (
    task: any,
    status: string,
    order: number,
    groupId: string,
    votes: number,
    deleteVotes: boolean,
  ) => {
    if (teamId && retrospectiveId) {
      const body = {
        id: task?.id,
        description: task?.description,
        assignee: task?.assignee,
        organization: organizationId,
        teamId,
        retrospectiveId,
        status: status,
        order: order,
        group: groupId,
        votes,
        deleteVotes,
      };

      await UpdateComments(body).catch((e) => {
        console.error('ERROR UpdateComment', e);
      });
    }
  };

  const [editCard, setEditCard] = useState('');
  const [showCard, setShowCard] = useState('');

  const [boardData, setBoardData] = useState<any[]>([]);

  const prevTasksRef = useRef<any>([]);
  const prevGroupsRef = useRef([]);

  useEffect(() => {
    const tasksChanged =
      JSON.stringify(tasks) !== JSON.stringify(prevTasksRef.current);
    const groupsChanged =
      JSON.stringify(groups) !== JSON.stringify(prevGroupsRef.current);

    if (tasksChanged || groupsChanged) {
      const tasksWithType = tasks.map((task) => ({
        ...task,
        type: 'comment',
      }));

      const groupsWithType = groups.map((group: any) => ({
        ...group,
        type: 'group',
      }));

      const mergedArray = [...tasksWithType, ...groupsWithType];

      mergedArray.sort((a, b) => a.order - b.order);

      const mergedArrayWithoutDuplicates = Array.from(
        new Set(mergedArray.map((item) => item.id)),
      ).map((id) => {
        return mergedArray.find((item) => item.id === id);
      });

      setBoardData(mergedArrayWithoutDuplicates);
    }

    prevTasksRef.current = tasks;
    prevGroupsRef.current = groups;
  }, [tasks, groups]);

  const saveOrderHandler = useCallback(async () => {
    const promises = boardData.map((task: any, index: number) => {
      task.order = index;
      if (task.type === 'comment') {
        return UpdateComment(
          task,
          task.status,
          index,
          task.group,
          task.votes,
          false,
        );
      } else {
        return onUpdateGroup(task, index, task.status);
      }
    });

  }, [boardData, onUpdateGroup, UpdateComment]);

  return (
    <div className="flex space-x-2 w-full overflow-auto">
      <WordCounterErrorModal
        showModal={showAiWordError}
        setShowModal={setShowAiWordError}
        message="This data is too large for our AI to Analyze"
      />
      <AiLoader
        cancelAction={onCancelAI}
        showModal={loadingAI}
        setShowModal={setLoadingAI}
        role={currentUserRole}
      />
      <RegenerateConfirmationModal
        setShowModal={setShowRegenerateWarning}
        showModal={showRegenerateWarning}
        message="All the grouping and tags will be deleted to let the AI regroup again. Are you sure you want to continue?"
        confirmAction={onRegenerateGroupingAI}
      />

      <DndContext
        sensors={
          rules.allowMembersGrabCards ||
          currentUserRole === MembershipRole.Facilitator
            ? sensors
            : undefined
        }
        onDragStart={
          rules.allowMembersGrabCards ||
          currentUserRole === MembershipRole.Facilitator
            ? onDragStart
            : undefined
        }
        onDragEnd={
          rules.allowMembersGrabCards ||
          currentUserRole === MembershipRole.Facilitator
            ? onDragEnd
            : undefined
        }
        onDragOver={
          rules.allowMembersGrabCards ||
          currentUserRole === MembershipRole.Facilitator
            ? onDragOver
            : undefined
        }
      >
        <div
          style={{
            height: !isScreenMobile ? '-webkit-fill-available' : 'auto',
          }}
          className={`bg-gray-100 w-full tv:pb-[150px] flex px-8 py-6 tv:px-36 justify-start  ${
            columns?.length <= 3 && 'xl:justify-center'
          } overflow-auto  items-start py-3 px-4`}
        >
          <div id="board-container" className="flex gap-2 lg:gap-20">
            {columns?.map((col) => (
              <ColumnContainer
                retrospective={retrospective}
                detatchTask={detatchTask}
                detatchAllTask={detatchAllTask}
                createTask={createTask}
                organizationId={organizationId}
                teamId={teamId}
                retrospectiveId={retrospectiveId}
                key={col.id}
                column={col}
                deleteTask={deleteTask}
                updateTask={updateTask}
                teamMembers={teamMembers}
                tags={tags}
                tasks={
                  tasks &&
                  tasks.filter((task: Comment) => task?.status === col.id)
                }
                groups={
                  groups &&
                  groups.filter((task: Group) => task?.status === col.id)
                }
                overTask={overTask}
                overAGroup={overAGroup}
                activeTask={activeTask}
                currentUser={currentUser}
                rules={rules}
                currentUserRole={currentUserRole}
                numberVotes={numberVotes}
                showCard={showCard === col.id}
                setShowCard={setShowCard}
                editCard={editCard}
                setEditCard={setEditCard}
                userId={currentUser.uid}
                boardData={
                  boardData &&
                  boardData.filter((task: Group) => task?.status === col.id)
                }
                confirmAIGrouping={confirmAIGrouping}
              />
            ))}
          </div>
        </div>

        {(rules.allowMembersGrabCards || currentUserRole > 0) &&
          createPortal(
            <DragOverlay>
              {activeTask && (
                <TaskCard
                  organizationId={organizationId}
                  teamId={teamId}
                  retrospectiveId={retrospectiveId}
                  key={activeTask.id}
                  comment={activeTask}
                  deleteTask={deleteTask}
                  updateTask={updateTask}
                  retrospective={retrospective}
                  groupMode={true}
                  activeTask={activeTask}
                  overTask={overTask}
                  active={true}
                  allowed={rules.allowMembersGrabCards || currentUserRole > 0}
                  currentUserRole={currentUserRole}
                  rules={rules}
                  editCard={editCard}
                  canGroup={true}
                  setEditCard={setEditCard}
                />
              )}
              {activeGroup && (
                <GroupCard
                  organizationId={organizationId}
                  teamId={teamId}
                  retrospectiveId={retrospectiveId}
                  key={activeGroup.id}
                  group={activeGroup}
                  deleteTask={deleteTask}
                  updateTask={updateTask}
                  detatchTask={detatchTask}
                  detatchAllTask={detatchAllTask}
                  confirmAIGrouping={confirmAIGrouping}
                  retrospective={retrospective}
                  overTask={overTask}
                  overAGroup={overAGroup}
                  activeTask={activeTask}
                  retroTeamTags={tags}
                  currentUser={currentUser}
                  numberVotes={numberVotes}
                  isVoting={false}
                  isAction={false}
                  allowed={rules.allowMembersGroup || currentUserRole > 0}
                  canGroup={true}
                  rules={rules}
                  userId={currentUser.uid}
                  currentUserRole={currentUserRole}
                />
              )}
            </DragOverlay>,
            document.body,
          )}
      </DndContext>
    </div>
  );

  function mergeVoters(activeData: any, overData: any) {
    for (const voterId in overData.voters) {
      if (activeData?.voters?.length > 0) {
        if (activeData.voters.hasOwnProperty(voterId)) {
          activeData.voters[voterId].votes += overData.voters[voterId].votes;
        } else {
          activeData.voters[voterId] = overData.voters[voterId];
        }
      }
    }
    return activeData;
  }

  function onDragStart(event: any) {
    if (event.active.data.current?.type === 'Task') {
      setActiveTask(event.active.data.current.task);
      return;
    }

    if (event.active.data.current?.type === 'Group') {
      setActiveGroup(event.active.data.current.task);
      return;
    }
  }

  async function groupCommentHandler(active: any, over: any) {
    // if (isProcessing) return;
    setCompletedCount((prev) => prev + 1);

    try {
      const activeData = active?.data?.current.task;
      const overData = over?.data?.current.task;

      const activeId = active.id as string;

      deleteTask(activeData.id);

      // addCommentGroup(overData.id, activeData);

      const totalVotes = overData.votes + activeData.votes;

      const mergedData = mergeVoters(activeData, overData);

      onAddTaskGroup(
        overData.id,
        activeId,
        overData.status,
        totalVotes,
        mergedData.voters,
      ),
        setCompletedCount((prev) => prev - 1);
    } catch (e) {
      console.error('Error on ', groupCommentHandler);
    } finally {
    }
  }

  async function onDragEnd(event: DragEndEvent) {
    try {
      setActiveTask(null);
      setActiveGroup(null);

      const { active, over } = event;
      if (!over) return;

      setOverTask('');
      setOverAGroup('');
      const activeId = active.id as string;
      const overId = over.id;

      if (activeId === overId) return;
      else {
        const isActiveATask = active?.data.current?.type === 'Task';
        const isActiveAGroup = active?.data.current?.type === 'Group';
        const isOverAGroup = over?.data.current?.type === 'Group';
        const isOverATask = over?.data.current?.type === 'Task';
        const isOverAColumn = over?.data.current?.type === 'Column';

        if (active.data.current && over.data.current) {
          // If user drop task over a task
          if (isActiveATask && isOverATask) {
            setCompletedCount((prev) => prev + 1);

            const activeData = active?.data?.current.task;
            const overData = over?.data?.current.task;

            const id = uuidv4();

            const commentGroup = [
              {
                id: activeData.id,
                votes: activeData.votes,
              },
              {
                id: overData.id,
                votes: overData.votes,
              },
            ];
            hideGroupTasks(commentGroup[0].id, overData.id);
            hideGroupTasks(commentGroup[1].id, overData.id);
            activeData.group = id;
            overData.group = id;
            const totalVotes = commentGroup.reduce(
              (total, item) => total + item.votes,
              0,
            );

            function mergeVoters(activeData: any, overData: any) {
              for (const voterId in overData.voters) {
                if (activeData.voters.hasOwnProperty(voterId)) {
                  activeData.voters[voterId].votes +=
                    overData.voters[voterId].votes;
                } else {
                  activeData.voters[voterId] = overData.voters[voterId];
                }
              }
              return activeData;
            }

            const mergedData = mergeVoters(activeData, overData);

            const body = {
              id: id,
              name: '',
              organizationId,
              retrospectiveId,
              comments: [activeData, overData],
              status: overData.status,
              votes: totalVotes,
              voters: mergedData.voters ? mergedData.voters : [],
              order: overData.order,
            } as any;

            createGroup(body);

            await onCreateGroup(
              id,
              commentGroup,
              overData.status,
              mergedData.voters ? mergedData.voters : [],
              overData.order,
            );
            setTimeout(() => {
              setCompletedCount((prev) => prev - 1);
            }, 3000);
          }
          // If user drop a task over a group
          else if (isActiveATask && isOverAGroup) {
            groupCommentHandler(active, over);
          }
          // If user drop a group over a task
          else if (isActiveAGroup && isOverATask) {
            groupCommentHandler(over, active);
          } else if (isActiveATask && isOverAColumn) {
            saveOrderHandler();
          } else if (isActiveAGroup && isOverAColumn) {
            saveOrderHandler();
          }
        }
      }
    } catch {}
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id;
    const overId = over.id as string;

    if (activeId === overId) return;
    const isActiveATask = active.data.current?.type === 'Task';
    const isActiveAGroup = active.data.current?.type === 'Group';
    const isOverAGroup = over.data.current?.type === 'Group';
    const isOverATask = over.data.current?.type === 'Task';

    // Im dropping a Task over another Task
    setOverTask(overId);

    const isOverAColumn = over.data.current?.type === 'Column';

    // Im dropping a Task over a column
    if (isActiveATask && isOverAColumn) {
      setCompletedCount((prev) => prev + 1);
      setBoardData((tasks: any) => {
        const activeIndex = tasks.findIndex((t: Comment) => t.id === activeId);

        tasks[activeIndex].status = overId;
        return arrayMove(tasks, activeIndex, activeIndex);
      });

      setCompletedCount((prev) => prev - 1);
      
      setTimeout(() => {
        saveOrderHandler();
      }, 500);
    }

    // Im dropping a Group over a column

    if (isActiveAGroup && isOverAColumn) {
      setCompletedCount((prev) => prev + 1);
      setBoardData((tasks: any) => {
        const activeIndex = tasks.findIndex((t: Comment) => t.id === activeId);

        tasks[activeIndex].status = overId;
        return arrayMove(tasks, activeIndex, activeIndex);
      });

      setCompletedCount((prev) => prev - 1);
      
      setTimeout(() => {
        saveOrderHandler();
      }, 500);
    }

    // Im dropping a Group over another Group
    if (
      isActiveAGroup &&
      isOverAGroup &&
      (rules.allowMembersGroup || currentUserRole > 0)
    ) {
      setCompletedCount((prev) => prev + 1);
      setGroups((groups: any) => {
        const activeIndex = groups.findIndex((t: Group) => t.id === activeId);
        const overIndex = groups.findIndex((t: Group) => t.id === overId);

        if (groups[activeIndex].status != groups[overIndex].status) {
          groups[activeIndex].status = groups[overIndex].status;
          return arrayMove(groups, activeIndex, overIndex - 1);
        }

        return arrayMove(groups, activeIndex, overIndex);
      });

      setCompletedCount((prev) => prev - 1);
    }

    // Im dropping a Task over a Group
    if (
      isActiveATask &&
      isOverAGroup &&
      (rules.allowMembersGroup ||
        currentUserRole === MembershipRole.Facilitator)
    ) {
      setOverAGroup(overId);
    }

    // Im dropping a Task over another Task
    if (
      isActiveATask &&
      isOverATask &&
      !rules.allowMembersGroup &&
      currentUserRole === 0
    ) {
      setCompletedCount((prev) => prev + 1);
      setTasks((tasks: any) => {
        const activeIndex = tasks.findIndex((t: Comment) => t.id === activeId);
        const overIndex = tasks.findIndex((t: Comment) => t.id === overId);

        if (tasks[activeIndex].status != tasks[overIndex].status) {
          tasks[activeIndex].status = tasks[overIndex].status;
          return arrayMove(tasks, activeIndex, overIndex - 1);
        }

        return arrayMove(tasks, activeIndex, overIndex);
      });

      setCompletedCount((prev) => prev - 1);
    }
  }
}

export default Board;
