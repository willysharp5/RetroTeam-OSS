import { useMemo, useState, useRef, useEffect } from 'react';

import Image from 'next/image';

import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import add from 'public/assets/svg/plus-black.svg';
import expand from 'public/assets/svg/expand.svg';

import Modal from '~/components/shared/modal';
import { boardPermissions } from '~/components/utils/boardPermissions';

import { ColumnContainerProps } from '~/lib/board/types/types';
import { MembershipRole } from '~/lib/organizations/types/membership-role';

import GroupCard from '../../GroupPage/board/GroupCard';
import ExpandiblePopover from '../../BoardPage/board/ExpandibleModal';
import AddCommentCard from '../../AddCommentCard';
import TaskCard from './TaskCard';
import If from '~/core/ui/If';

function ColumnContainer({
  column,
  createTask,
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
  voteNumber,
  setVoteNumber,
  currentUserRole,
  rules,
  showCard,
  setShowCard,
  editCard,
  setEditCard,
  userId,
  boardData,
  showSettingsModal = false,
  confirmAIGrouping,
  isDoneVoting,
  setIsDoneVoting,
  loadingVotes,
  setLoadingVotes,
  myTotalVotes,
  maxVotesGlobal
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
  }, [tasks, groups]);

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
      if (showSettingsModal) {
        setRemainingHeight(remainingheight - 360);
      } else {
        setRemainingHeight(remainingheight - 180);
      }
    }
  };

  useEffect(() => {
    if (currentUserRole === MembershipRole.Facilitator) {
      calculateRemainingHeight();
    } else {
      const screenHeight = window.innerHeight;
      const contentHeight =
        document.getElementById('board-container')?.offsetHeight;
      if (contentHeight) {
        const remainingheight = screenHeight - contentHeight;
        setRemainingHeight(remainingheight - 180);
      }
    }

    window.addEventListener('resize', calculateRemainingHeight);
    return () => window.removeEventListener('resize', calculateRemainingHeight);
  }, [showSettingsModal]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="w-[400px] h-auto rounded-md flex flex-col"
    >
      <div>
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
          className=" bg-white mx-2 border rounded-md p-2 flex space-x-2 items-center my-4 relative"
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
        className={`space-y-4 md:max-h-[1200px] pb-6 overflow-y-auto ${
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
              createTask={createTask}
              setShowCard={setShowCard}
              column={column}
              retrospectiveId={retrospectiveId}
              textAreaRef={textAreaRef}
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
                        updateTask={updateTask}
                        retrospective={retrospective}
                        numberVotes={numberVotes}
                        voteNumber={voteNumber}
                        allowed={isAllowedToGrab}
                        rules={rules}
                        currentUserRole={currentUserRole}
                        editCard={editCard}
                        setEditCard={setEditCard}
                        deleteTask={deleteTask}
                        isDoneVoting={isDoneVoting as boolean}
                        loadingVotes={loadingVotes}
                        setLoadingVotes={setLoadingVotes}
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
                        voteNumber={voteNumber}
                        isVoting={true}
                        isAction={false}
                        allowed={isAllowedToGrab}
                        canGroup={
                          rules.allowMembersGroup || currentUserRole > 0
                        }
                        rules={rules}
                        userId={userId}
                        currentUserRole={currentUserRole}
                        confirmAIGrouping={confirmAIGrouping}
                        isDoneVoting={isDoneVoting}
                        loadingVotes={loadingVotes}
                        setLoadingVotes={setLoadingVotes}
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
            voteNumber={voteNumber}
            isVoting={true}
            currentUserRole={currentUserRole}
            rules={rules}
            userId={userId}
            confirmAIGrouping={confirmAIGrouping}
            isDoneVoting={isDoneVoting}
            loadingVotes={loadingVotes}
            setLoadingVotes={setLoadingVotes}
            myTotalVotes={myTotalVotes}
            maxVotesGlobal={maxVotesGlobal}
          ></ExpandiblePopover>
        </Modal>
      )}
    </div>
  );
}

export default ColumnContainer;
