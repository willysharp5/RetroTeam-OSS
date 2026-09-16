import { useCallback, useEffect, useState } from 'react';
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
import useUpdateComments from '~/lib/board/hooks/use-update-comments';
import { BoardColumn, Comment, Group } from '~/lib/board/types/types';
import { createPortal } from 'react-dom';
import TaskCard from './TaskCard';
import GroupCard from '../../GroupPage/board/GroupCard';
import toast from 'react-hot-toast';
import isMobile from '~/components/utils/deviceDetecter';
import useUpdateGroup from '~/lib/board/hooks/use-update-group';
import { MembershipRole } from '~/lib/organizations/types/membership-role';

function Board({
  organizationId,
  teamId,
  retrospectiveId,
  retrospective,
  comments,
  setTasks,
  createTask,
  deleteTask,
  detatchTask,
  detatchAllTask,
  updateTask,
  tasks,
  teamMembers,
  structure,
  groups,
  tags,
  currentUser,
  setGroups,
  onUpdateGroup,
  updateGroups,
  currentUserRole,
  numberVotes,
  showSettingsModal,
  setShowSettingsModal,
  onUpdateBoardSettings,
  voteNumber,
  setVoteNumber,
  rules,
  settingVotes,
  setSettingVotes,
  userId,
  myTotalVotes,
  loadingVotes,
  setLoadingVotes,
  maxVotesGlobal
}: any) {
  const isScreenMobile = isMobile();

  const [columns, setColumns] = useState<BoardColumn[]>(structure);
  const [boardData, setBoardData] = useState<any[]>([]);

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
        voters: task.voters,
      };
      UpdateComments(body)
        .then((res: any) => {})
        .catch((e) => {
          console.error('ERROR updateActions', e);
        });
    }
  };

  const [showCard, setShowCard] = useState('');
  const [editCard, setEditCard] = useState('');

  const [totalVotes, setTotalVotes] = useState(0);

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

    mergedArray.sort((a, b) => a.order - b.order);

    const mergedArrayWithoutDuplicates = Array.from(
      new Set(mergedArray.map((item) => item.id)),
    ).map((id) => {
      return mergedArray.find((item) => item.id === id);
    });
    setBoardData(mergedArrayWithoutDuplicates);
  }, [tasks, groups]);

  const saveOrderHandler = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const promises = boardData.map((task: any, index: number) => {
      task.order = index;

      if (task.type === 'comment') {
        return UpdateComment(task, task.status, index);
      } else {
        return onUpdateGroup(task, index, task.status);
      }
    });
  }, [boardData, onUpdateGroup, UpdateComment]);

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

  const [isDoneVoting, setIsDoneVoting] = useState(false);

  useEffect(() => { 
    if (myTotalVotes >= settingVotes) {
      setIsDoneVoting(true);
    }else{
      setIsDoneVoting(false)
    }
  }, [myTotalVotes, settingVotes]);


  return (
    <div
      style={{
        height: !isScreenMobile ? '-webkit-fill-available' : 'auto',
      }}
      className={`bg-gray-100 tv:px-36 tv:pb-[150px]  justify-start w-full overflow-auto`}
    >
      {showSettingsModal && currentUserRole === MembershipRole.Facilitator && (
        <div className="py-2.5 px-5 bg-[#FAFAFA] space-y-2 border-[#F1F1F3] border rounded-md m-auto items-center w-fit">
          <p className="text-sm text-black">Vote settings</p>
          <input
            type="number"
            value={settingVotes}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              setSettingVotes(value);
            }}
            max={20}
            min={totalVotes > 0 ? totalVotes : 0}
            className="border border-[#E4E4E7] w-[360px] px-4 py-2 rounded-md"
          ></input>
          <p className="text-sm text-[#71717A]">
            Number of votes per participant (20 max)
          </p>
          <div className="flex items-center justify-end space-x-2.5">
            <button
              onClick={() => setShowSettingsModal(false)}
              className="bg-white border-[#E4E4E7] border px-4 py-2 rounded-md mt-3"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (settingVotes != '') {
                  if (settingVotes > 20) {
                    toast.error('The maximum number of votes is 20');
                  } else if (settingVotes >= totalVotes) {
                    onUpdateBoardSettings('votes', settingVotes, 'modal');
                  } else {
                    toast.error("You can't set votes less than " + totalVotes);
                  }
                } else {
                  toast.error('Please set a vote number');
                }
              }}
              className="bg-black px-4 py-2 rounded-md text-white mt-3"
            >
              Confirm
            </button>
          </div>
        </div>
      )}
      <div className="flex space-x-2 w-full h-full ">
        <DndContext
          sensors={sensors}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragOver={onDragOver}
        >
          <div className="w-full">
            <div
              id="board-container"
              className={`flex px-8 py-6 h-full w-full items-start gap-2 lg:gap-20 justify-start  ${
                columns?.length <= 3 && 'xl:justify-center'
              } py-3 px-4`}
            >
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
                  voteNumber={voteNumber}
                  setVoteNumber={setVoteNumber}
                  showCard={showCard === col.id}
                  setShowCard={setShowCard}
                  editCard={editCard}
                  setEditCard={setEditCard}
                  userId={userId}
                  boardData={
                    boardData &&
                    boardData.filter((task: Group) => task?.status === col.id)
                  }
                  showSettingsModal={showSettingsModal}
                  confirmAIGrouping={confirmAIGrouping}
                  isDoneVoting={isDoneVoting}
                  setIsDoneVoting={setIsDoneVoting}
                  loadingVotes={loadingVotes}
                  setLoadingVotes={setLoadingVotes}
                  myTotalVotes={myTotalVotes}
                  maxVotesGlobal={maxVotesGlobal}
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
                  updateTask={updateTask}
                  retrospective={retrospective}
                  active={true}
                  numberVotes={numberVotes}
                  voteNumber={voteNumber}
                  allowed={true}
                  currentUserRole={currentUserRole}
                  rules={rules}
                  editCard={editCard}
                  setEditCard={setEditCard}
                  deleteTask={deleteTask}
                  isDoneVoting={isDoneVoting}
                  loadingVotes={loadingVotes}
                  setLoadingVotes={setLoadingVotes}
                  myTotalVotes={myTotalVotes}
                  maxVotesGlobal={maxVotesGlobal}
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
                  isVoting={true}
                  isAction={false}
                  allowed={true}
                  canGroup={true}
                  rules={rules}
                  userId={userId}
                  currentUserRole={currentUserRole}
                  confirmAIGrouping={confirmAIGrouping}
                  isDoneVoting={isDoneVoting}
                />
              )}
            </DragOverlay>,
            document.body,
          )}
        </DndContext>
      </div>
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
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    setActiveGroup(null);
    
    saveOrderHandler(); 
 
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

    // Im dropping a Task over another Task

    if (isActiveATask && isOverATask) {
      setBoardData((tasks: any) => {
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

    // Im dropping a Task over a Group or Im dropping a Group over a Task
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

      /* array.map((task: any, index: number) => {
        if (task.type === 'comment') {
          UpdateComment(task, task.status, index);
        } else {
          onUpdateGroup(task, index);
        }
      });*/
    }

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
      setBoardData((groups: any) => {
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
