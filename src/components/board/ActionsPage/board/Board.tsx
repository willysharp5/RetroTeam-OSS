import { useCallback, useEffect, useState } from 'react';
import toaster from 'react-hot-toast';
import { createPortal } from 'react-dom';

import { Column, Task } from '~/lib/actions/types/actions';
import { BoardColumn, Comment, Group } from '~/lib/board/types/types';
import useUpdateComments from '~/lib/board/hooks/use-update-comments';
import useUpdateGroup from '~/lib/board/hooks/use-update-group';

import ColumnContainer from './ColumnContainer';
import TaskCard from '../../BoardPage/board/TaskCard';
import ActionContainer from './ActionContainer';
import GroupCard from '../../GroupPage/board/GroupCard';
import ActionCard from './ActionCard';

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
import useUpdateActions from '~/lib/board/hooks/use-update-action';

const actionCol: Column[] = [
  {
    id: 'action',
    title: 'Action Items',
  },
];

function Board({
  organizationId,
  teamId,
  retrospectiveId,
  retrospective,
  comments,
  createTask,
  deleteTask,
  detatchTask,
  detatchAllTask,
  updateTask,
  tasks,
  createAction,
  updateAction,
  deleteAction,
  archiveAction,
  teamMembers,
  structure,
  groups,
  tags,
  currentUser,
  setGroups,
  currentUserRole,
  numberVotes,
  actions,
  setActions,
  rules,
  showCard,
  setShowCard,
  userId,
  onUpdateGroup,
  refetchTeamMembers,
  loadingMembers,
  aiData,
  remaining,
  getAiActions,
  restrictions,
  loadingAI,
  onCancelAI,
  canUseAI,
  organizationData
}: any) {
  const [columns, setColumns] = useState<BoardColumn[]>([]);

  const [boardData, setBoardData] = useState<any[]>([]);

  useEffect(() => {
    const tasksWithType = tasks.map((task: Comment) => ({
      ...task,
      type: 'comment',
    }));
    const groupsWithType = groups.map((group: Group) => ({
      ...group,
      type: 'group',
    }));

    const mergedArray = [...tasksWithType, ...groupsWithType];

    mergedArray.sort((a, b) => b.votes - a.votes);

    const mergedArrayWithoutDuplicates = Array.from(
      new Set(mergedArray.map((item) => item.id)),
    ).map((id) => {
      return mergedArray.find((item) => item.id === id);
    });
    setBoardData(mergedArrayWithoutDuplicates);
  }, [tasks, groups]);

  const [activeTask, setActiveTask] = useState<Comment | null>(null);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [activeAction, setActiveAction] = useState<Task | null>(null);

  const { trigger: UpdateComments } = useUpdateComments();

  const UpdateComment = (task: any, status: string, order: number) => {
    if (teamId && retrospectiveId) {
      const body = {
        id: task.id,
        description: task.description,
        assignee: task.assignee,
        organization: organizationId,
        teamId,
        retrospectiveId,
        status: status,
        order: order,
        group: task.group,
        votes: task.votes,
        voter: task.voters,
      };
      UpdateComments(body)
        .then((res: any) => {})
        .catch((e) => {
          console.error('ERROR UpdateComment', e);
        });
    }
  };

  useEffect(() => {
    setColumns(structure);
  }, [structure]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
  );

  const [editCard, setEditCard] = useState('');

  const saveOrderHandler = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    boardData.map((task: any, index: number) => {
      task.order = index;

      if (task.type === 'comment') {
        return UpdateComment(task, task.status, index);
      } else {
        return onUpdateGroup(task, index, task.status);
      }
    });
  }, [boardData, onUpdateGroup, UpdateComment]);

    // Update ActionsOrder

    const { trigger: updateActions } = useUpdateActions();

    const UpdateAction = async (action: Task, order: number) => {
      const body = {
        id: action.id,
        description: action.description,
        assignee: action.assignee,
        organization: organizationId,
        date: action.date,
        order: order,
        teamId: action.team,
        retrospectiveId: retrospectiveId,
        facilitator: currentUser.uid,
      };
  
      updateActions(body)
        .then((res: any) => {})
        .catch((e) => {
          console.error('ERROR updateActions', e);
        });
    };

  const saveActionOrderHandler = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    actions.map((task: any, index: number) => {
      task.order = index;

      return UpdateAction(task, index);
    });
  }, [actions, UpdateAction]);

  const { trigger: updateGroupData } = useUpdateGroup();

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
          setGroups(_groups);
        }
      })
      .catch((e: any) => {
        console.error('ERROR onCreateGroup', e);
      });
    await toaster.promise(promise, {
      loading: 'Grouping comments',
      success: 'Comments has been grouped',
      error: 'Error grouping comments',
    });
  }

  return (
    <div className="flex gap-20 mx-auto w-full md:overflow-visible">
      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
      >
        <div className="w-full">
          <div className="m-auto space-y-4 w-[350px] md:w-[400px] ">
            {columns?.map((col) => (
              <ColumnContainer
                retrospective={retrospective}
                organizationId={organizationId}
                teamId={teamId}
                retrospectiveId={retrospectiveId}
                key={col.id}
                column={col}
                createTask={createTask}
                deleteTask={deleteTask}
                detatchTask={detatchTask}
                detatchAllTask={detatchAllTask}
                updateTask={updateTask}
                teamMembers={teamMembers}
                tasks={
                  comments &&
                  comments.filter((task: Comment) => task.status === col.id)
                }
                groups={
                  groups &&
                  groups.filter((task: Comment) => task?.status === col.id)
                }
                tags={tags}
                currentUser={currentUser}
                rules={rules}
                currentUserRole={currentUserRole}
                numberVotes={numberVotes}
                showCard={showCard === col.id}
                setShowCard={setShowCard}
                editCard={editCard}
                setEditCard={setEditCard}
                userId={userId}
                boardData={
                  boardData &&
                  boardData.filter((task: Group) => task?.status === col.id)
                }
                confirmAIGrouping={confirmAIGrouping}
              />
            ))}
          </div>
        </div>
        <div className="w-full">
          <div className="m-auto space-y-4 w-[400px] ">
            {actionCol.map((col) => (
              <ActionContainer
                refetch={() => {}}
                organizationId={organizationId}
                teamId={teamId}
                key={col.id}
                column={col}
                createAction={createAction}
                updateAction={updateAction}
                deleteAction={deleteAction}
                archiveAction={archiveAction}
                actions={
                  actions &&
                  actions.filter((task: Comment) => task.archive === false)
                }
                retrospective={retrospective}
                retrospectiveId={retrospectiveId}
                teamMembers={teamMembers}
                currentUserRole={currentUserRole}
                rules={rules}
                showCard={showCard === col.id}
                setEditCard={setEditCard}
                editCard={editCard}
                refetchTeamMembers={refetchTeamMembers}
                loadingMembers={loadingMembers}
                aiData={aiData}
                remaining={remaining}
                loadingAI={loadingAI}
                getAiActions={getAiActions}
                restrictions={restrictions}
                onCancelAI={onCancelAI}
                canUseAI={canUseAI}
                currentUser={currentUser}
                organizationData={organizationData}
              />
            ))}
          </div>
        </div>

        {createPortal(
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
                groupMode={false}
                activeTask={null}
                overTask={null}
                allowed={true}
                isAction={true}
                currentUserRole={currentUserRole}
                rules={rules}
                editCard={editCard}
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
                detatchTask={detatchTask}
                detatchAllTask={detatchAllTask}
                updateTask={updateTask}
                retrospective={retrospective}
                overTask={''}
                overAGroup={''}
                activeTask={activeTask}
                retroTeamTags={tags}
                currentUser={currentUser}
                numberVotes={numberVotes}
                isVoting={false}
                isAction={true}
                allowed={true}
                canGroup={true}
                rules={rules}
                userId={userId}
                currentUserRole={currentUserRole}
                confirmAIGrouping={confirmAIGrouping}
              />
            )}
            {activeAction && (
              <ActionCard
                index={''}
                organizationId={organizationId}
                action={activeAction}
                deleteTask={deleteAction}
                updateTask={updateAction}
                archiveTask={archiveAction}
                teamMembers={teamMembers}
                retrospectiveId={retrospectiveId}
                active={true}
                retrospective={retrospective}
                currentUserRole={currentUserRole}
                rules={rules}
                editCard={editCard}
                setEditCard={setEditCard}
                refetchTeamMembers={refetchTeamMembers}
                loadingMembers={loadingMembers}
                organizationData={organizationData}
              />
            )}
          </DragOverlay>,
          document.body,
        )}
      </DndContext>
    </div>
  );

  function onDragStart(event: any) {
    if (event.active.data.current?.type === 'Task') {
      setActiveTask(event.active.data.current.task);
      return;
    }
    if (event.active.data.current?.type === 'Group') {
      setActiveGroup(event.active.data.current.task);
      return;
    }
    if (event.active.data.current?.type === 'Action') {
      setActiveAction(event.active.data.current.task);
      return;
    }
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    setActiveGroup(null);
    setTimeout(() => {
      saveOrderHandler();
      saveActionOrderHandler()
    }, 500);
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === 'Task';
    const isActiveAGroup = active.data.current?.type === 'Group';
    const isOverATask = over.data.current?.type === 'Task';
    const isOverAGroup = over.data.current?.type === 'Group';

    const isActiveAction = active.data.current?.type === 'Action';
    const isOverAction = over.data.current?.type === 'Action';

    // Im dropping an Action over another Action

    if (isActiveAction && isOverAction) {
      setActions((tasks: any) => {
        const activeIndex = tasks.findIndex((t: Comment) => t.id === activeId);
        const overIndex = tasks.findIndex((t: Comment) => t.id === overId);

        if (tasks[activeIndex].status != tasks[overIndex].status) {
          tasks[activeIndex].status = tasks[overIndex].status;
          return arrayMove(tasks, activeIndex, overIndex - 1);
        }

        return arrayMove(tasks, activeIndex, overIndex);
      });
    }

    const isOverAColumn = over.data.current?.type === 'Column';

    // Im dropping a Task over a column
    if (isActiveATask && isOverAColumn) {
      setBoardData((tasks: any) => {
        const activeIndex = tasks.findIndex((t: Comment) => t.id === activeId);

        tasks[activeIndex].status = overId;
        return arrayMove(tasks, activeIndex, activeIndex);
      });
    }

    /* Im dropping a Task over a Group or Im dropping a Group over a Task
    if ((isActiveATask && isOverAGroup) || (isActiveAGroup && isOverATask)) {
      let array = [] as any;
      setBoardData((tasks: any) => {
        const activeIndex = tasks.findIndex((t: Comment) => t.id === activeId);
        const overIndex = tasks.findIndex((t: Comment) => t.id === overId);
        if (tasks[activeIndex].status != tasks[overIndex].status) {
          tasks[activeIndex].status = tasks[overIndex].status;
          array = arrayMove(tasks, activeIndex, overIndex - 1);
          return arrayMove(tasks, activeIndex, overIndex - 1);
        }
        array = arrayMove(tasks, activeIndex, overIndex);
        return arrayMove(tasks, activeIndex, overIndex);
      });

      array.map((task: any, index: number) => {
        if (task.type === 'comment') {
          UpdateComment(task, task.status, index);
        } else {
          onUpdateGroup(task, index);
        }
      });
    }*/

    // Im dropping a Group over a column
    if (isActiveAGroup && isOverAColumn) {
      setGroups((tasks: any) => {
        const activeIndex = tasks.findIndex((t: Comment) => t.id === activeId);

        tasks[activeIndex].status = overId;
        return arrayMove(tasks, activeIndex, activeIndex);
      });
    }

    // Im dropping a Group over another Group
    if (isActiveAGroup && isOverAGroup) {
      setGroups((groups: any) => {
        const activeIndex = groups.findIndex((t: Group) => t.id === activeId);
        const overIndex = groups.findIndex((t: Group) => t.id === overId);

        if (groups[activeIndex].status != groups[overIndex].status) {
          groups[activeIndex].status = groups[overIndex].status;
          return arrayMove(groups, activeIndex, overIndex - 1);
        }

        return arrayMove(groups, activeIndex, overIndex);
      });
    }
  }
}

export default Board;
