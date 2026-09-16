import Image from 'next/image';

import { useMemo, useState, useRef, useEffect } from 'react';

import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import collaps from 'public/assets/svg/collaps.svg';
import uncollaps from 'public/assets/svg/double-arrow-up.svg';
import add from 'public/assets/svg/plus-black.svg';

import expand from 'public/assets/svg/expand.svg';

import TaskCard from '../../BoardPage/board/TaskCard';
import Modal from '~/components/shared/modal';

import GroupCard from '../../GroupPage/board/GroupCard';
import AddCommentCard from '../../AddCommentCard';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@radix-ui/react-collapsible';
import ExpandiblePopover from '../../BoardPage/board/ExpandibleModal';
import { BoardColumn, Group, Tag } from '~/lib/board/types/types';
import { Id } from '~/lib/actions/types/actions';
import { Retrospectives } from '~/lib/retrospectives/types/retrospectives';

interface ColumnContainerProps {
  column: BoardColumn;
  updateTask: (id: string, content: Comment) => void;
  deleteTask: (id: Id) => void;
  detatchTask: (content: Comment) => void;
  detatchAllTask: (id: Id) => void;

  tasks: Comment[];
  groups: Group[];
  retrospective: Retrospectives;
  tags: Tag[];
  currentUser: any;
  updateGroups: (id: string, content: Group) => void;
  overTask?: string | null;
  activeTask?: Comment | null;
  numberVotes: number;
  voteNumber?: any;
  setVoteNumber?: any;
  showCard: any;
  setShowCard: (card: any) => void;
  editCard: any;
  setEditCard: (card: any) => void;
  boardData: any;
  showSettingsModal?: boolean;
  isDoneVoting?: boolean;
  setIsDoneVoting?: (isDone: boolean) => void;
  createTask: (content: Comment) => void;
  loadingVotes?: boolean;
  setLoadingVotes?: (loading: boolean) => void;
  isSuperAdmin?: boolean;
  totalVotes: number;
  showAuthors: boolean;
}

function ColumnContainer({
  column,
  tasks,
  groups,
  createTask,
  deleteTask,
  updateTask,
  detatchTask,
  detatchAllTask,
  tags,
  currentUser,
  numberVotes,
  retrospective,
  showCard,
  setShowCard,
  editCard,
  setEditCard,
  boardData,
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

  const [isCollapsed, setIsCollapsed] = useState(false);

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

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.focus();
    }
  }, [showCard]);

  const totalComments = Array.isArray(tasks) ? tasks.length : 0;
  const totalGroups = Array.isArray(groups) ? groups.length : 0;

  const isAllowedToCreate = isSuperAdmin;
  const isAllowedToGrab = isSuperAdmin;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-md flex flex-col space-y-4"
    >
      <Collapsible defaultOpen={true}>
        <div className="flex mx-2 bg-orange-500 text-white rounded-[5px] p-2.5 justify-between">
          <div className="my-auto">
            <h6 className="font-bold ">{column.name}</h6>
          </div>
          <div className="flex space-x-2.5">
            <button
              onClick={() => {
                if (totalComments + totalGroups > 0)
                  showPopOverHandler(column.name);
              }}
              className="w-9 h-9 rounded-md bg-white"
            >
              <Image src={expand} className="m-auto" alt="expand" />
            </button>
            <CollapsibleTrigger
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-9 h-9 rounded-md bg-white"
            >
              <Image
                src={isCollapsed ? collaps : uncollaps}
                className="m-auto"
                alt="collaps"
              />
            </CollapsibleTrigger>
            <div className="p-4 w-9 h-9 rounded-md bg-[#F4F4F5] flex justify-center items-center">
              <p className="text-sm text-black">
                {totalComments + totalGroups}
              </p>
            </div>
          </div>
        </div>
        <CollapsibleContent>
          {isAllowedToCreate && (
            <button
              id="board-container"
              onClick={(e) => {
                e.stopPropagation();
                setShowCard(column.id);
              }}
              style={{ width: '-webkit-fill-available' }}
              className="mx-2 border bg-white rounded-md p-2 flex space-x-2 items-center my-4 relative"
            >
              <Image
                src={add}
                alt="add"
                style={{
                  width: '16px',
                  height: '16px',
                  pointerEvents: 'none',
                }}
              />
              <p className="text-sm text-[#71717A]"> Add your comment</p>
            </button>
          )}

          <div
            className={`space-y-4 md:max-h-[700px] pb-6 overflow-y-auto ${
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
                            isAction={true}
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
                            currentUser={currentUser}
                            numberVotes={numberVotes}
                            isVoting={false}
                            isAction={true}
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
        </CollapsibleContent>

        {showPopOver && (
          <Modal onClose={closeModalHandler}>
            <div
              style={{ opacity: 0.7 }}
              className="absolute top-0 left-0 w-full h-full bg-black z-50 opactiy-5"
            ></div>
            <ExpandiblePopover
              tasks={tasks}
              groups={groups}
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
              isAction={true}
              isSuperAdmin={isSuperAdmin}
              totalVotes={totalVotes}
              showAuthors={showAuthors}
            ></ExpandiblePopover>
          </Modal>
        )}
      </Collapsible>
    </div>
  );
}

export default ColumnContainer;
