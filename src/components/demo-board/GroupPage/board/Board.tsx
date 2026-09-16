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
import { BoardColumn, Comment, Group, Tag } from '~/lib/board/types/types';
import { v4 as uuidv4 } from 'uuid';

import GroupCard from './GroupCard';
import { Id } from '~/lib/actions/types/actions';
import { TeamMembers } from '~/lib/teams/types/teams';
import { Structure } from '~/lib/structures/types/structures';

import isMobile from '~/components/utils/deviceDetecter';
import useUpdateDemoComments from '~/lib/demo/hooks/use-update-demo-comment';

import { Retrospectives } from '~/lib/retrospectives/types/retrospectives';
import useCreateDemoGroup from '~/lib/demo/hooks/use-create-demo-group';
import useAddDemoCommentGroup from '~/lib/demo/hooks/use-add-demo-comment';

interface GroupBoard {
  tasks: Comment[];
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
  onUpdateGroup: (group: Group, index: number, status: string) => void;
  updateGroups: (id: string, content: Group) => void;
  numberVotes: number;
  createTask: (task: Comment) => void;
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
  isSuperAdmin: boolean;
  retrospective: Retrospectives;
  showAuthors: boolean;
}

function Board({
  tasks,
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
  onUpdateGroup,
  updateGroups,
  numberVotes,
  isSuperAdmin,
  createTask,
  setIsProcessing,
  retrospective,
  showAuthors
}: GroupBoard) {
  const isScreenMobile = isMobile();

  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    setIsProcessing(completedCount != 0);
  }, [completedCount]);

  const [columns, setColumns] = useState<BoardColumn[]>(structure);

  const [overTask, setOverTask] = useState('');
  const [overAGroup, setOverAGroup] = useState('');

  const { trigger: addGroupData } = useCreateDemoGroup();
  const { trigger: groupComment } = useAddDemoCommentGroup();
  const { trigger: UpdateComments } = useUpdateDemoComments();

  useEffect(() => {
    if (structure) setColumns(structure);
  }, [structure]);

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
      comments,
      status,
      order,
      votes: totalVotes ? totalVotes : 0,
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
    const body = {
      id: task?.id,
      description: task?.description,
      assignee: task?.assignee,
      status: status,
      order: order,
      group: groupId,
      votes,
      deleteVotes,
    };

    await UpdateComments(body).catch((e) => {
      console.error('ERROR UpdateComment', e);
    });
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
      <DndContext
        sensors={isSuperAdmin ? sensors : undefined}
        onDragStart={isSuperAdmin ? onDragStart : undefined}
        onDragEnd={isSuperAdmin ? onDragEnd : undefined}
        onDragOver={isSuperAdmin ? onDragOver : undefined}
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
                detatchTask={detatchTask}
                detatchAllTask={detatchAllTask}
                createTask={createTask}
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
                updateGroups={updateGroups}
                numberVotes={numberVotes}
                showCard={showCard === col.id}
                setShowCard={setShowCard}
                editCard={editCard}
                setEditCard={setEditCard}
                retrospective={retrospective}
                boardData={
                  boardData &&
                  boardData.filter((task: Group) => task?.status === col.id)
                }
                isSuperAdmin={isSuperAdmin}
                showAuthors={showAuthors}
              />
            ))}
          </div>
        </div>

        {(isSuperAdmin) &&
          createPortal(
            <DragOverlay>
              {activeTask && (
                <TaskCard
                  key={activeTask.id}
                  comment={activeTask}
                  deleteTask={deleteTask}
                  updateTask={updateTask}
                  groupMode={true}
                  activeTask={activeTask}
                  overTask={overTask}
                  active={true}
                  allowed={isSuperAdmin}
                  editCard={editCard}
                  canGroup={isSuperAdmin}
                  setEditCard={setEditCard}
                  isSuperAdmin={isSuperAdmin}
                  showAuthors={showAuthors}
                  retrospective={retrospective}
                />
              )}
              {activeGroup && (
                <GroupCard
                  key={activeGroup.id}
                  group={activeGroup}
                  deleteTask={deleteTask}
                  updateTask={updateTask}
                  detatchTask={detatchTask}
                  detatchAllTask={detatchAllTask}
                  overTask={overTask}
                  overAGroup={overAGroup}
                  activeTask={activeTask}
                  retroTeamTags={tags}
                  numberVotes={numberVotes}
                  isVoting={false}
                  isAction={false}
                  allowed={isSuperAdmin}
                  canGroup={isSuperAdmin}
                  isSuperAdmin={isSuperAdmin}
                  showAuthors={showAuthors}
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
        totalVotes ? totalVotes : 0,
        mergedData.voters ? mergedData.voters : 0,
      ),
        UpdateComment(
          activeData,
          activeData.status,
          activeData.order,
          overData.id,
          0,
          false,
        );

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
      (isSuperAdmin)
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
      (isSuperAdmin)
    ) {
      setOverAGroup(overId);
    }
 
  }
}

export default Board;
