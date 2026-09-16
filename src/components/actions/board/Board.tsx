import { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from 'reactfire';

import { Task, Column, BoardActionsProps } from '~/lib/actions/types/actions';
import useUpdateActions from '~/lib/actions/hooks/update-actions';

import ColumnContainer from './ColumnContainer';
import TaskCard from './TaskCard';

import { showDatePickerValue } from '~/components/utils/dateformatter';

import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

const defaultCols: Column[] = [
  {
    id: 'To do',
    title: 'To Do',
  },
  {
    id: 'In Progress',
    title: 'In Progress',
  },
  {
    id: 'Done',
    title: 'Done',
  },
];

function Board({
  organizationId,
  teamId,
  refetch,
  actions,
  setTasks,
  createTask,
  deleteTask,
  updateTask,
  archiveTask,
  setTasksFilter,
  teamMembers,
  refetchTeamMembers,
  loadingMembers,
  organizationData,
}: BoardActionsProps) {
  const columns = defaultCols;
  const auth = useAuth();
  const currentUser = auth.currentUser?.uid as string;
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const [editCard, setEditCard] = useState('');

  const { trigger: updateActions } = useUpdateActions(organizationId);

  const saveActionOrderHandler = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    actions.map((task: any, index: number) => {
      let date;

      date = showDatePickerValue(task.date);
      const body = {
        id: task.id,
        description: task.description,
        assignee: task.assignee,
        organization: organizationId,
        teamId: teamId,
        date: date ? date : '',
        status: task.status,
        order: index,
        facilitator: currentUser,
      };

      return updateActions(body);
    });
  }, [actions, currentUser, organizationId, teamId, updateActions]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
  );

  const [showCard, setShowCard] = useState('');

  return (
    <div
      id="action-container"
      className="absolute h-auto mt-10 flex px-8 py-6 w-full items-start gap-2 lg:gap-20 justify-start overflow-auto  items-start py-3 px-4"
    >
      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
      >
        <div className="">
          <div id="action-container" className="flex gap-2 tv:gap-20 m-auto">
            {columns.map((col) => (
              <ColumnContainer
                teamId={teamId}
                archiveTask={archiveTask}
                refetch={refetch}
                organizationId={organizationId}
                key={col.id}
                column={col}
                createTask={createTask}
                deleteTask={deleteTask}
                updateTask={updateTask}
                teamMembers={teamMembers}
                tasks={
                  actions &&
                  actions.filter(
                    (task: Task) =>
                      task.status === col.id && task.archive === false,
                  )
                }
                showCard={showCard === col.id}
                setShowCard={setShowCard}
                editCard={editCard}
                setEditCard={setEditCard}
                refetchTeamMembers={refetchTeamMembers}
                loading={loadingMembers}
                organizationData={organizationData}
              />
            ))}
          </div>
        </div>

        {createPortal(
          <DragOverlay>
            {activeTask && (
              <TaskCard
                teamId={teamId}
                organizationId={organizationId}
                action={activeTask}
                deleteTask={deleteTask}
                updateTask={updateTask}
                archiveTask={archiveTask}
                index=""
                teamMembers={teamMembers}
                active={true}
                editCard={editCard}
                setEditCard={setEditCard}
                refetchTeamMembers={refetchTeamMembers}
                loading={loadingMembers}
                organizationData={organizationData}
              />
            )}
          </DragOverlay>,
          document.body,
        )}
      </DndContext>
    </div>
  );
  function onDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === 'Task') {
      setActiveTask(event.active.data.current.task);
      return;
    }
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveTask(null);

    setTimeout(() => {
      saveActionOrderHandler();
    }, 500);
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === 'Task';
    const isOverATask = over.data.current?.type === 'Task';

    if (!isActiveATask) return;

    // Im dropping a Task over another Task
    if (isActiveATask && isOverATask) {
      setTasks((tasks: any) => {
        const activeIndex = tasks.findIndex((t: Task) => t.id === activeId);
        const overIndex = tasks.findIndex((t: Task) => t.id === overId);

        if (tasks[activeIndex].status != tasks[overIndex].status) {
          tasks[activeIndex].status = tasks[overIndex].status;
          return arrayMove(tasks, activeIndex, overIndex - 1);
        }

        return arrayMove(tasks, activeIndex, overIndex);
      });
      setTasksFilter((tasks: any) => {
        const activeIndex = tasks.findIndex((t: Task) => t.id === activeId);
        const overIndex = tasks.findIndex((t: Task) => t.id === overId);

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
      setTasks((tasks: any) => {
        const activeIndex = tasks.findIndex((t: Task) => t.id === activeId);

        tasks[activeIndex].status = overId;
        return arrayMove(tasks, activeIndex, activeIndex);
      });
      setTasksFilter((tasks: any) => {
        const activeIndex = tasks.findIndex((t: Task) => t.id === activeId);

        tasks[activeIndex].status = overId;
        return arrayMove(tasks, activeIndex, activeIndex);
      });
    }
  }
}

export default Board;
