import { useEffect, useState, useRef, useCallback } from 'react';
import { Column, Task } from '~/lib/actions/types/actions';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { createPortal } from 'react-dom';
import ActionContainer from '~/components/board/ActionsPage/board/ActionContainer';
import ActionCard from '~/components/board/ActionsPage/board/ActionCard';
import { arrayMove } from '@dnd-kit/sortable';
import useUpdateActions from '~/lib/board/hooks/use-update-action';

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

function ActionBoardContainer({
  organizationId,
  teamId,
  retrospectiveId,
  retrospective,
  createAction,
  archiveAction,
  updateAction,
  deleteAction,
  teamMembers,
  currentUser,
  currentUserRole,
  actions,
  rules,
  showCard,
  organizationData,
  refetchTeamMembers,
  loadingMembers,
}: any) {
  const [tasks, setTasks] = useState<Task[]>([]);

  const [activeAction, setActiveAction] = useState<Task | null>(null);

  const [editCard, setEditCard] = useState('');

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
      status: action.status
    };

    updateActions(body)
      .then((res: any) => {})
      .catch((e) => {
        console.error('ERROR updateActions', e);
      });
  };


  const saveActionsOrderHandler = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const promises = tasks.map((task: any, index: number) => {
      task.order = index;

      return UpdateAction(task, index);
    });


  }, [tasks, UpdateAction]);


  useEffect(() => {
    setTasks(actions);
  }, [actions]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    saveActionsOrderHandler()
    setActiveAction(null);
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === 'Action';
    const isOverATask = over.data.current?.type === 'Action';

    if (!isActiveATask) return;
    // Im dropping a Task over another Task
    if (isActiveATask && isOverATask) {
      setTasks((tasks: any) => {
        const activeIndex = tasks.findIndex((t: Task) => t.id === activeId);
        const overIndex = tasks.findIndex((t: Task) => t.id === overId);

        if (tasks[activeIndex] && tasks[overIndex]) {
          if (tasks[activeIndex].status !== tasks[overIndex].status) {
            tasks[activeIndex].status = tasks[overIndex].status;
            return arrayMove(tasks, activeIndex, overIndex - 1);
          }
        }

        return arrayMove(tasks, activeIndex, overIndex);
      });
    }

    const isOverAColumn = over.data.current?.type === 'ColumnAction';

    // Im dropping a Task over a column
    if (isActiveATask && isOverAColumn) {
      setTasks((tasks: any) => {
        const activeIndex = tasks.findIndex((t: Task) => t.id === activeId);

        tasks[activeIndex].status = overId;
        return arrayMove(tasks, activeIndex, activeIndex);
      });
    }
  }

  function onDragStart(event: any) {
    if (event.active.data.current?.type === 'Action') {
      setActiveAction(event.active.data.current.task);
      return;
    }
  }

  return (
    <div className="flex gap-20 mx-auto w-full md:overflow-visible">
      <DndContext
        sensors={sensors}
        onDragEnd={onDragEnd}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
      >
        <div className="w-full">
          <div className="flex gap-2 m-auto">
            {defaultCols.map((col) => (
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
                  tasks &&
                  tasks.filter(
                    (task: Task) =>
                      task.status === col.id && task.archive === false,
                  )
                }
                retrospective={retrospective}
                retrospectiveId={retrospectiveId}
                teamMembers={teamMembers}
                currentUserRole={currentUserRole}
                rules={rules}
                showCard={showCard === col.id}
                setEditCard={setEditCard}
                editCard={editCard}
                isBoard={false}
                refetchTeamMembers={refetchTeamMembers}
                loadingMembers={loadingMembers}
                currentUser={currentUser}
                organizationData={organizationData}
              />
            ))}
          </div>
        </div>

        {createPortal(
          <DragOverlay>
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
                organizationData={organizationData}
                retrospective={retrospective}
                currentUserRole={currentUserRole}
                rules={rules}
                editCard={editCard}
                setEditCard={setEditCard}
                refetchTeamMembers={refetchTeamMembers}
                loadingMembers={loadingMembers}
              />
            )}
          </DragOverlay>,
          document.body,
        )}
      </DndContext>
    </div>
  );
}

export default ActionBoardContainer;
