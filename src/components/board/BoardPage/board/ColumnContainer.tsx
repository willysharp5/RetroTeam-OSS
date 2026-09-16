import { SortableContext, useSortable } from '@dnd-kit/sortable';
import expand from 'public/assets/svg/expand.svg';

import { CSS } from '@dnd-kit/utilities';
import { useMemo, useState, useRef, useEffect } from 'react';

import add from 'public/assets/svg/plus-black.svg';

import TaskCard from './TaskCard';
import Image from 'next/image';
import Modal from '~/components/shared/modal';
import { ColumnContainerProps, Comment, Group } from '~/lib/board/types/types';

import GroupCard from '../../GroupPage/board/GroupCard';
import ExpandiblePopover from './ExpandibleModal';
import AddCommentCard from '../../AddCommentCard';
import If from '~/core/ui/If';
import { boardPermissions } from '~/components/utils/boardPermissions';

function ColumnContainer({
  column,
  tasks,
  groups,
  deleteTask,
  detatchTask,
  detatchAllTask,
  updateTask,
  organizationId,
  teamId,
  retrospectiveId,
  retrospective,
  teamMembers,
  tags,
  currentUser,
  numberVotes,
  currentUserRole,
  rules,
  showCard,
  setShowCard,
  editCard,
  setEditCard,
  userId,
  boardData,
  confirmAIGrouping,
  createTask,
  myTotalVotes = 0,
  maxVotesGlobal = 0,
}: ColumnContainerProps) {
  const [showPopOver, setShowPopOver] = useState(false);
  const [columnFilter, setColumnFilter] = useState('');

  const groupsIds = useMemo(() => {
    return groups && groups.map((group) => group.id);
  }, [groups]);

  const closeModalHandler = () => {
    setShowPopOver(false);
  };

  const showPopOverHandler = (column: any) => {
    setShowPopOver(true);
    setColumnFilter(column);
  };

  const { setNodeRef, transform, transition } = useSortable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
    disabled: false,
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const [totalContent, setTotalContent] = useState(0);

  useEffect(() => {
    setTotalContent(boardData.length);
  }, [boardData]);

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.focus();
    }
  }, [showCard]);

  const [isAllowedToCreate, setIsAllowedToCreate] = useState(false);
  const [isAllowedToGrab, setIsAllowedToGrab] = useState(true);
  
  useEffect(() => {
    if (retrospective && rules) {
      const permissions = boardPermissions(
        retrospective,
        rules,
        currentUserRole,
        undefined,
        currentUser.uid,
        currentUser.isAnonymous || !currentUser.email,
        false
      );
      setIsAllowedToCreate(permissions.isAllowedToCreate);
      setIsAllowedToGrab(permissions.isAllowedToGrab);
    }
  }, [retrospective, rules, currentUserRole]);
  const [remainingHeight, setRemainingHeight] = useState(0);

  const calculateRemainingHeight = () => {
    const screenHeight = window.innerHeight;
    const contentHeight =
      document.getElementById('board-container')?.offsetHeight;

    if (contentHeight) {
      const remainingheight = screenHeight - contentHeight;
      setRemainingHeight(remainingheight - 180);
    }
  };

  useEffect(() => {
    calculateRemainingHeight();
    window.addEventListener('resize', calculateRemainingHeight);
    return () => window.removeEventListener('resize', calculateRemainingHeight);
  }, []);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="w-[400px] h-auto rounded-md flex flex-col"
    >
      <div className="">
        <div
          id="board-container"
          className="w-[400px] flex bg-orange-500 text-white rounded-[5px] p-2.5 justify-between"
        >
          <div className="my-auto">
            <h6 className="font-bold ">{column.name}</h6>
          </div>
          <div className="flex space-x-2.5">
            <button
              onClick={() => {
                if (totalContent > 0) showPopOverHandler(column.name);
              }}
              className="w-9 h-9 rounded-md bg-white"
            >
              <Image src={expand} className="m-auto" alt="expand" />
            </button>
            <div className="p-4 w-9 h-9 rounded-md bg-[#F4F4F5] flex justify-center items-center">
              <p className="text-sm text-black">{totalContent}</p>
            </div>
          </div>
        </div>
      </div>
      <If condition={isAllowedToCreate}>
        <button
          id="board-container"
          onClick={(e) => {
            e.stopPropagation();
            setShowCard(column.id);
          }}
          className="bg-white mx-2 border rounded-md p-2 flex space-x-2 items-center my-4 relative"
        >
          <Image
            src={add}
            alt="add"
            style={{ width: '16px', height: '16px', pointerEvents: 'none' }}
          />
          <p className="text-sm text-[#71717A]"> Add your comment</p>
        </button>
      </If>

      <div
        style={{
          maxHeight: `${remainingHeight > 0 ? remainingHeight : 0}px`,
        }}
        className={`space-y-4  pb-6 overflow-y-auto ${
          !isAllowedToCreate && 'mt-6'
        }`}
      >
        {showCard && (
          <div className="mx-2">
            <AddCommentCard
              retrospective={retrospective}
              teamId={teamId}
              teamMembers={teamMembers}
              organizationId={organizationId}
              setShowCard={setShowCard}
              column={column}
              retrospectiveId={retrospectiveId}
              textAreaRef={textAreaRef}
              createTask={createTask}
            ></AddCommentCard>
          </div>
        )}

        <div className="space-y-4">
          <SortableContext items={groupsIds}>
            {boardData &&
              boardData.map((task: any, index: number) => {
                if (task.type === 'comment') {
                  return (
                    <div className="mx-2" key={index}>
                      <TaskCard
                        organizationId={organizationId}
                        teamId={teamId}
                        retrospectiveId={retrospectiveId}
                        key={task.id}
                        comment={task}
                        deleteTask={deleteTask}
                        updateTask={updateTask}
                        retrospective={retrospective}
                        groupMode={false}
                        activeTask={null}
                        overTask={null}
                        allowed={isAllowedToGrab}
                        rules={rules}
                        currentUserRole={currentUserRole}
                        editCard={editCard}
                        setEditCard={setEditCard}
                        myTotalVotes={myTotalVotes}
                        maxVotesGlobal={maxVotesGlobal}
                      />
                    </div>
                  );
                } else {
                  return (
                    <div className="mx-2" key={index}>
                      <GroupCard
                        organizationId={organizationId}
                        teamId={teamId}
                        retrospectiveId={retrospectiveId}
                        key={task.id}
                        group={task}
                        deleteTask={deleteTask}
                        detatchTask={detatchTask}
                        detatchAllTask={detatchAllTask}
                        updateTask={updateTask}
                        retrospective={retrospective}
                        overTask={''}
                        overAGroup={''}
                        activeTask={''}
                        retroTeamTags={tags}
                        currentUser={currentUser}
                        numberVotes={numberVotes}
                        isVoting={false}
                        isAction={false}
                        allowed={isAllowedToGrab}
                        canGroup={
                          rules.allowMembersGroup || currentUserRole > 0
                        }
                        rules={rules}
                        userId={userId}
                        currentUserRole={currentUserRole}
                        confirmAIGrouping={confirmAIGrouping}
                        myTotalVotes={myTotalVotes}
                        maxVotesGlobal={maxVotesGlobal}
                      />
                    </div>
                  );
                }
              })}{' '}
          </SortableContext>
        </div>
      </div>

      {showPopOver && (
        <Modal onClose={closeModalHandler}>
          <div
            style={{ opacity: 0.7 }}
            className="absolute top-0 left-0 w-full h-full bg-black z-50 opactiy-5"
          ></div>
          <ExpandiblePopover
            tasks={tasks}
            groups={groups}
            organizationId={organizationId}
            teamId={teamId}
            teamMembers={teamMembers}
            retrospectiveId={retrospectiveId}
            deleteTask={deleteTask}
            detatchTask={detatchTask}
            detatchAllTask={detatchAllTask}
            updateTask={updateTask}
            closeModalHandler={closeModalHandler}
            columnFilter={columnFilter}
            retrospective={retrospective}
            tags={tags}
            currentUser={currentUser}
            numberVotes={numberVotes}
            currentUserRole={currentUserRole}
            rules={rules}
            userId={userId}
            confirmAIGrouping={confirmAIGrouping}
            myTotalVotes={myTotalVotes}
            maxVotesGlobal={maxVotesGlobal}
          ></ExpandiblePopover>
        </Modal>
      )}
    </div>
  );
}

export default ColumnContainer;
