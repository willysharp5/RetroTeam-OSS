import { useMemo, useState, useRef, useEffect } from 'react';

import Image from 'next/image';

import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import expand from 'public/assets/svg/expand.svg';
import add from 'public/assets/svg/plus-black.svg';

import TaskCard from '../../BoardPage/board/TaskCard';
import GroupCard from './GroupCard';
import ExpandiblePopover from '../../BoardPage/board/ExpandibleModal';
import AddCommentCard from '../../AddCommentCard';

import Modal from '~/components/shared/modal';
import { Group } from '~/lib/board/types/types';
import { Task } from '~/lib/actions/types/actions';

function ColumnContainer({
  column,
  createTask,
  tasks,
  deleteTask,
  detatchTask,
  detatchAllTask,
  updateTask,
  organizationId,
  teamId,
  retrospectiveId,
  retrospective,
  teamMembers,
  overTask,
  activeTask,
  overAGroup,
  groups,
  tags,
  totalVotes,
  numberVotes,
  showCard,
  setShowCard,
  editCard,
  setEditCard,
  showAuthors,
  boardData,
  isSuperAdmin = false,
}: any) {
  const [showPopOver, setShowPopOver] = useState(false);
  const [columnFilter, setColumnFilter] = useState('');

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

  const groupsIds = useMemo(() => {
    return groups && groups.map((group: Group) => group.id);
  }, [groups]);

  const [totalContent, setTotalContent] = useState(0);

  useEffect(() => {
    const totaltasks = tasks.filter((task: Task) => task.group === '').length;
    const totalgroups = groups.length;
    setTotalContent(totaltasks + totalgroups);
  }, [tasks, groups]);

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
      className="w-[400px] rounded-md flex flex-col space-y-4"
    >
      <div>
        <div
          id="board-container"
          className="md:w-[400px] w-full flex bg-orange-500 text-white rounded-[5px] p-2.5 justify-between"
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
      {isAllowedToCreate && (
        <button
          id="board-container"
          onClick={(e) => {
            e.stopPropagation();
            setShowCard(column.id);
          }}
          className="mx-2 bg-white border rounded-md p-2 flex space-x-2 items-center my-4 relative"
        >
          <Image
            src={add}
            alt="add"
            style={{ width: '16px', height: '16px', pointerEvents: 'none' }}
          />
          <p className="text-sm text-[#71717A]"> Add your comment</p>
        </button>
      )}
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
              createTask={createTask}
              setShowCard={setShowCard}
              column={column}
              textAreaRef={textAreaRef}
              retrospective={retrospective}
            ></AddCommentCard>
          </div>
        )}

        <div className="space-y-4">
          <SortableContext items={groupsIds}>
            {boardData &&
              boardData.map((task: any, index: number) => {
                if (task.type === 'comment') {
                  if (task.group === '')
                    return (
                      <div className="mx-2" key={index}>
                        <TaskCard
                          key={task.id}
                          comment={task}
                          deleteTask={deleteTask}
                          updateTask={updateTask}
                          showAuthors={showAuthors}
                          groupMode={true}
                          activeTask={activeTask}
                          overTask={overTask}
                          allowed={isAllowedToGrab}
                          editCard={editCard}
                          setEditCard={setEditCard}
                          canGroup={isSuperAdmin}
                          isAction={false}
                          isSuperAdmin={isSuperAdmin}
                          retrospective={retrospective}
                        />
                      </div>
                    );
                } else {
                  return (
                    <div className="mx-2" key={index}>
                      <GroupCard
                        showAuthors={showAuthors}
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
                        overAGroup={overAGroup}
                        activeTask={''}
                        retroTeamTags={tags}
                        numberVotes={numberVotes}
                        isVoting={false}
                        isAction={false}
                        allowed={isAllowedToGrab}
                        canGroup={isSuperAdmin}
                        isSuperAdmin={isSuperAdmin}
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
