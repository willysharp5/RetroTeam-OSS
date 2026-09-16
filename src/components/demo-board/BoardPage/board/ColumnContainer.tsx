import { SortableContext, useSortable } from '@dnd-kit/sortable';
import expand from 'public/assets/svg/expand.svg';

import { CSS } from '@dnd-kit/utilities';
import { useMemo, useState, useRef, useEffect } from 'react';

import add from 'public/assets/svg/plus-black.svg';

import TaskCard from './TaskCard';
import Image from 'next/image';
import Modal from '~/components/shared/modal';

import GroupCard from '../../GroupPage/board/GroupCard';
import ExpandiblePopover from './ExpandibleModal';
import AddCommentCard from '../../AddCommentCard';
import If from '~/core/ui/If';
import { BoardColumn, Group, Tag } from '~/lib/board/types/types';
import { Id } from '~/lib/actions/types/actions';
import { TeamMembers } from '~/lib/teams/types/teams';
import { Retrospectives } from '~/lib/retrospectives/types/retrospectives';

interface ColumnContainerProps {
  column: BoardColumn;
  tasks: any;
  groups: Group[];
  deleteTask: (id: Id) => void;
  detatchTask: any;
  detatchAllTask: (id: Id) => void;
  updateTask: any;
  retrospective: Retrospectives;
  teamMembers: any[] | TeamMembers[] | null;
  tags: Tag[];
  numberVotes: number;
  showCard: any;
  setShowCard: (card: any) => void;
  editCard: any;
  setEditCard: (card: any) => void;
  boardData: any;
  createTask: any;
  isSuperAdmin: boolean;

  overTask?: string | null;
  activeTask?: Comment | null;
  overAGroup?: string | null;
  voteNumber?: any;
  setVoteNumber?: any;
  showSettingsModal?: boolean;
  isDoneVoting?: boolean;
  setIsDoneVoting?: (isDone: boolean) => void;
  loadingVotes?: boolean;
  setLoadingVotes?: (loading: boolean) => void;
  totalVotes: number;
  showAuthors: boolean;
}

function ColumnContainer({
  column,
  tasks,
  groups,
  deleteTask,
  detatchTask,
  detatchAllTask,
  updateTask,
  retrospective,
  teamMembers,
  tags,
  numberVotes,
  showCard,
  setShowCard,
  editCard,
  setEditCard,
  boardData,
  createTask,
  isSuperAdmin = false,
  totalVotes,
  showAuthors
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

  const isAllowedToCreate = isSuperAdmin;
  const isAllowedToGrab = isSuperAdmin;

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
              setShowCard={setShowCard}
              column={column}
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
                        key={task.id}
                        comment={task}
                        deleteTask={deleteTask}
                        updateTask={updateTask}
                        showAuthors={showAuthors}
                        groupMode={false}
                        activeTask={null}
                        overTask={null}
                        allowed={isAllowedToGrab}
                        editCard={editCard}
                        setEditCard={setEditCard}
                        isSuperAdmin={isSuperAdmin}
                        retrospective={retrospective}
                      />
                    </div>
                  );
                } else {
                  return (
                    <div className="mx-2" key={index}>
                      <GroupCard
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
                        numberVotes={numberVotes}
                        isVoting={false}
                        isAction={false}
                        allowed={isAllowedToGrab}
                        canGroup={isSuperAdmin}
                        isSuperAdmin={isSuperAdmin}
                        showAuthors={showAuthors}
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
            teamMembers={teamMembers}
            deleteTask={deleteTask}
            detatchTask={detatchTask}
            detatchAllTask={detatchAllTask}
            updateTask={updateTask}
            closeModalHandler={closeModalHandler}
            columnFilter={columnFilter}
            retrospective={retrospective}
            tags={tags}
            numberVotes={numberVotes}
            isSuperAdmin={isSuperAdmin}
            totalVotes={totalVotes}
            showAuthors={showAuthors}
          ></ExpandiblePopover>
        </Modal>
      )}
    </div>
  );
}

export default ColumnContainer;
