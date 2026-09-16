import React, { useState } from 'react';

import {
  useSensors,
  useSensor,
  PointerSensor,
  DndContext,
  closestCorners,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  DragOverlay,
  DropAnimation,
  defaultDropAnimation,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

import { Task, Status, BoardSections } from '~/lib/actions/types/actions';

import BoardSection from './boardSection';
import TaskItem from './taskItem';
import useUpdateActions from '~/lib/actions/hooks/update-actions';
import { useAuth } from 'reactfire';

export const BOARD_SECTIONS = {
  'To Do': 'To Do',
  'In Progress': 'In Progress',
  Done: 'Done',
};

export const getTasksByStatus = (tasks: Task[], status: Status) => {
  return tasks.filter((task) => task.status === status);
};

export const getTaskById = (tasks: Task[], id: string) => {
  return tasks.find((task) => task.id === id);
};

export const initializeBoard = (tasks: Task[]) => {
  const boardSections: BoardSections = {};
  if (!tasks) {
    return BOARD_SECTIONS;
  }

  Object.keys(BOARD_SECTIONS).forEach((boardSectionKey) => {
    boardSections[boardSectionKey] = getTasksByStatus(
      tasks,
      boardSectionKey as Status,
    );
  });

  return boardSections;
};

export const findBoardSectionContainer = (
  boardSections: BoardSections,
  id: string,
) => {
  if (id in boardSections) {
    return id;
  }

  const container = Object.keys(boardSections).find((key) =>
    boardSections[key].find((item) => item.id === id),
  );
  return container;
};

const BoardSectionList = ({ actions, organizationId, refetch }: any) => {
  const [tasksData, setTasksData] = useState(actions);
  const initialBoardSections = initializeBoard(tasksData);
  const [boardSections, setBoardSections] = useState<any>(initialBoardSections);

  const { trigger: updateActions } = useUpdateActions(organizationId);

  const auth = useAuth();
  const currentUser = auth.currentUser?.uid as string;

  const [activeTaskId, setActiveTaskId] = useState<null | string>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );
  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveTaskId(active.id as string);
  };

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    const activeContainer = findBoardSectionContainer(
      boardSections,
      active.id as string,
    );
    const overContainer = findBoardSectionContainer(
      boardSections,
      over?.id as string,
    );

    if (
      !activeContainer ||
      !overContainer ||
      activeContainer === overContainer
    ) {
      return;
    }

    setBoardSections((boardSection: any) => {
      const activeItems = boardSection[activeContainer];
      const overItems = boardSection[overContainer];

      // Find the indexes for the items
      const activeIndex = activeItems.findIndex(
        (item: any) => item.id === active.id,
      );
      const overIndex = overItems.findIndex(
        (item: any) => item.id !== over?.id,
      );

      return {
        ...boardSection,
        [activeContainer]: [
          ...boardSection[activeContainer].filter(
            (item: any) => item.id !== active.id,
          ),
        ],
        [overContainer]: [
          ...boardSection[overContainer].slice(0, overIndex),
          boardSections[activeContainer][activeIndex],
          ...boardSection[overContainer].slice(
            overIndex,
            boardSection[overContainer].length,
          ),
        ],
      };
    });
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const activeContainer = findBoardSectionContainer(
      boardSections,
      active.id as string,
    );
    const overContainer = findBoardSectionContainer(
      boardSections,
      over?.id as string,
    );

    if (
      !activeContainer ||
      !overContainer ||
      activeContainer !== overContainer
    ) {
      return;
    }

    const activeIndex = boardSections[activeContainer].findIndex(
      (task: any) => task.id === active.id,
    );
    const overIndex = boardSections[overContainer].findIndex(
      (task: any) => task.id === over?.id,
    );

    if (activeIndex !== overIndex) {
      setBoardSections((boardSection: any) => ({
        ...boardSection,
        [overContainer]: arrayMove(
          boardSection[overContainer],
          activeIndex,
          overIndex,
        ),
      }));
    }

    const body = {
      id: activeTaskId,
      description: '',
      assignee: '',
      organization: organizationId,
      date: '',
      status: activeContainer,
      facilitator: currentUser,
    };

    updateActions(body)
      .then((res) => {})
      .catch((e) => {
        console.log('ERROR updateActions', e);
      });

    setActiveTaskId(null);
  };

  const dropAnimation: DropAnimation = {
    ...defaultDropAnimation,
  };

  const task = activeTaskId ? getTaskById(tasksData, activeTaskId) : null;

  const handleTaskUpdate = (updatedTask: any) => {
    setTasksData(updatedTask);
  };

  return (
    <div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="mt-20 md:flex space-x-2 w-full">
          {Object.keys(boardSections).map((boardSectionKey) => (
            <div key={boardSectionKey} className="flex-1">
              <BoardSection
                organizationId={organizationId}
                id={boardSectionKey}
                title={boardSectionKey}
                tasks={boardSections[boardSectionKey]}
                refetch={refetch}
                onTaskUpdate={handleTaskUpdate}
              />
            </div>
          ))}
          <DragOverlay dropAnimation={dropAnimation}>
            {task ? (
              <TaskItem
                task={task}
                organizationId={organizationId}
                onTaskUpdate={handleTaskUpdate}
              />
            ) : null}
          </DragOverlay>
        </div>
      </DndContext>
    </div>
  );
};

export default BoardSectionList;
