import { useState, useEffect, useCallback } from 'react';

import { Comment, Group, Tag } from '~/lib/board/types/types';
import Board from '~/components/demo-board/ActionsPage/board/Board';
import { Id, Task } from '~/lib/actions/types/actions';

import Image from 'next/image';

import chat from '/public/assets/svg/chat-bubble.svg';
import thumbsUp from '/public/assets/svg/thumbs-up.svg';
import { Structure } from '~/lib/structures/types/structures';

import isMobile from '~/components/utils/deviceDetecter';

import { useUpdateRetrospectiveSettings } from '~/lib/retrospectives/hooks/use-update-retrospective-settings';

import { Retrospectives } from '~/lib/retrospectives/types/retrospectives';
import useFetchDemoActions from '~/lib/server/demo/get-demo-actions';

interface ActionPageProps {
  tags: Tag[];
  groups: Group[];
  setGroups: (group: Group[]) => void;
  comments: Comment[];
  updateTask: (id: string, content: Comment) => void;
  deleteTask: (id: Id) => void;
  detatchTask: (task: Comment) => void;
  detatchAllTask: (groupId: Id) => void;
  createGroup: (content: Group) => void;
  onUpdateGroup: (group: Group, order: number, status: string) => void;
  hideGroupTasks: (id: Id, group: string) => void;
  updateGroups: (id: string, content: Group) => void;
  numberVotes: number;
  showSettingsModal: boolean;
  setShowSettingsModal: (show: boolean) => void;
  onUpdateBoardSettings: (type: string, value: any, from: string) => void;
  voterNumber: number;
  setVoteNumber: (number: number) => void;
  retrospective: Retrospectives;
  createTask: (task: Comment) => void;
  isSuperAdmin: boolean;
  showAuthors: boolean;
}

export default function ActionPage({
  tags,
  groups,
  setGroups,
  comments,
  updateTask,
  deleteTask,
  detatchTask,
  detatchAllTask,
  createGroup,
  hideGroupTasks,
  onUpdateGroup,
  updateGroups,
  numberVotes,
  showSettingsModal,
  setShowSettingsModal,
  onUpdateBoardSettings,
  voterNumber,
  setVoteNumber,
  retrospective,
  createTask,
  isSuperAdmin,
  showAuthors
}: ActionPageProps) {
  
  const { data: actionsData } = useFetchDemoActions();

  const [tasks, setTasks] = useState<Comment[]>([]);
  const [actions, setActions] = useState<Task[]>([]);
  const [retrospectiveData, setRetrospectiveData] = useState<any>([]);
  const [aiData, setAIData] = useState();
  
  useEffect(() => {
    if (actionsData) {
      setActions(actionsData);
    }
  }, [actionsData]);

  function createAction(content: Task) {
    const updatedTasks = [content, ...actions];

    setActions(updatedTasks);
  }

  function deleteAction(id: Id) {
    const newTasks = actions.filter((task) => task.id !== id);
    setActions(newTasks);
  }

  function updateAction(id: string, content: Task) {
    const newTasks = actions.map((task) => {
      if (task.id === id) {
        task = content;
      }
      return task;
    });

    setActions(newTasks);
  }

  function archiveAction(id: string, archive: boolean) {
    const updatedTasks = actions.map((task) => {
      if (task.id === id) {
        task.archive = archive;
      }
      return task;
    });

    setActions(updatedTasks);
  }

  useEffect(() => {
    if (comments) {
      setTasks(comments);
    }
  }, [comments]);

  useEffect(() => {
    if (retrospective) setRetrospectiveData(retrospective);
  }, [retrospective]);

  function addCommentGroup(id: any, comment: Comment) {
    const groupIndex = groups.findIndex((item) => item.id === id);

    if (groupIndex !== -1) {
      groups[groupIndex].comments = groups[groupIndex].comments || [];
      groups[groupIndex].comments.push(comment);
    } else {
      console.error(`Group doesnt exist ${id}`);
    }
  }

  useEffect(() => {
    if (retrospectiveData?.actionsWithAI) {
      if (retrospectiveData.aiActions) {
        setAIData(retrospectiveData.aiActions);
      }
    }
  }, [retrospectiveData]);

  return (
    <Content
      retrospective={retrospective}
      tasks={tasks}
      groups={groups}
      data={tasks}
      actions={actions}
      setTasks={setTasks}
      setGroups={setGroups}
      setActions={setActions}
      updateTask={updateTask}
      deleteTask={deleteTask}
      detatchTask={detatchTask}
      detatchAllTask={detatchAllTask}
      createGroup={createGroup}
      addCommentGroup={addCommentGroup}
      hideGroupTasks={hideGroupTasks}
      createAction={createAction}
      updateAction={updateAction}
      archiveAction={archiveAction}
      deleteAction={deleteAction}
      structure={retrospectiveData.structure}
      tags={tags}
      onUpdateGroup={onUpdateGroup}
      updateGroups={updateGroups}
      numberVotes={numberVotes}
      showSettingsModal={showSettingsModal}
      setShowSettingsModal={setShowSettingsModal}
      onUpdateBoardSettings={onUpdateBoardSettings}
      voteNumber={voterNumber}
      setVoteNumber={setVoteNumber}
      createTask={createTask}
      isSuperAdmin={isSuperAdmin}
      aiData={aiData}
      showAuthors={showAuthors}
    />
  );
}

interface ActionContentProps {
  retrospective: Retrospectives;
  tasks: Comment[];
  groups?: any[] | null;
  data: any;
  setTasks: (Task: Comment[]) => void;
  setGroups: (Group: Group[]) => void;
  setActions: (Action: Task[]) => void;
  updateTask: (id: string, content: Comment) => void;
  deleteTask: (id: string) => void;
  detatchTask: (content: Comment) => void;
  detatchAllTask: (groupId: Id) => void;
  createGroup: (group: Group) => void;
  updateGroups: (id: string, group: Group) => void;
  onUpdateGroup: (group: Group, order: number, status: string) => void;
  addCommentGroup: (id: string, comment: Comment) => void;
  hideGroupTasks: (id: string, id2: string) => void;
  createAction: (content: Task) => void;
  updateAction: (id: string, content: Task) => void;
  archiveAction: (id: string, archive: boolean) => void;
  deleteAction: (id: string) => void;
  structure?: Structure[];
  tags?: Tag[];
  numberVotes: number;
  showSettingsModal?: boolean;
  setShowSettingsModal?: (show: boolean) => void;
  onUpdateBoardSettings?: (type: string, value: any, from: string) => void;
  voteNumber?: number;
  setVoteNumber?: (number: number) => void;
  actions: Task[];
  createTask: (task: Comment) => void;
  isSuperAdmin: boolean;
  aiData: any;
  showAuthors: boolean;
}

function Content({
  tasks,
  groups,
  data,
  updateTask,
  deleteTask,
  detatchTask,
  detatchAllTask,
  createGroup,
  addCommentGroup,
  hideGroupTasks,
  setTasks,
  setActions,
  createAction,
  updateAction,
  archiveAction,
  deleteAction,
  structure,
  retrospective,
  tags,
  setGroups,
  onUpdateGroup,
  updateGroups,
  showSettingsModal,
  setShowSettingsModal,
  onUpdateBoardSettings,
  voteNumber,
  setVoteNumber,
  actions,
  createTask,
  isSuperAdmin,
  aiData,
  showAuthors
}: ActionContentProps) {
  const isScreenMobile = isMobile();

  const [numberVotes, setNumberVotes] = useState(5);
  const [selectedColumns, setSelectedColumns] = useState<Structure[]>([]);
  const [showCard, setShowCard] = useState('');

  useEffect(() => {
    if (retrospective && typeof retrospective.votes === 'number') {
      setNumberVotes(retrospective.votes);
    }
    setSelectedColumns(retrospective?.structure);
  }, [retrospective]);

  return (
    <div
      style={{
        height: !isScreenMobile ? '-webkit-fill-available' : 'auto',
      }}
      className={`flex px-8 py-6 tv:px-36 ${
        !isScreenMobile && 'xl:absolute'
      } bg-gray-100 min-h-[1000px]  xl:h-[85%] tv:h-[90%] justify-start overflow-auto w-full items-start gap-2 lg:gap-20 py-3 px-4`}
    >
      <div className="space-y-4">
        {structure?.map((column, index) => {
          column.order = index;
          return (
            <ColumnTab
              retrospective={retrospective}
              key={index}
              column={column}
              comments={data.filter(
                (task: Comment) => task.status === column.id,
              )}
              groups={groups?.filter(
                (task: Group) => task.status === column.id,
              )}
              selectedColumns={selectedColumns}
              setSelectedColumns={setSelectedColumns}
            />
          );
        })}
      </div>
      <Board
        numberVotes={numberVotes}
        setNumberVotes={setNumberVotes}
        comments={data}
        updateTask={updateTask}
        deleteTask={deleteTask}
        detatchTask={detatchTask}
        detatchAllTask={detatchAllTask}
        createGroup={createGroup}
        addCommentGroup={addCommentGroup}
        hideGroupTasks={hideGroupTasks}
        setTasks={setTasks}
        setGroups={setGroups}
        setActions={setActions}
        createAction={createAction}
        updateAction={updateAction}
        archiveAction={archiveAction}
        deleteAction={deleteAction}
        tasks={tasks}
        structure={selectedColumns}
        retrospective={retrospective}
        groups={groups}
        tags={tags}
        onUpdateGroup={onUpdateGroup}
        updateGroups={updateGroups}
        actions={actions}
        showSettingsModal={showSettingsModal}
        setShowSettingsModal={setShowSettingsModal}
        onUpdateBoardSettings={onUpdateBoardSettings}
        voteNumber={voteNumber}
        setVoteNumber={setVoteNumber}
        showCard={showCard}
        setShowCard={setShowCard}
        createTask={createTask}
        isSuperAdmin={isSuperAdmin}
        aiData={aiData}
        showAuthors={showAuthors}
      ></Board>
    </div>
  );
}

interface ColumnTabProps {
  retrospective: Retrospectives;
  column: any;
  comments: Comment[];
  groups: Group[] | null | undefined;
  selectedColumns: Structure[];
  setSelectedColumns: (columns: any) => void;
}

function ColumnTab({
  retrospective,
  column,
  comments,
  groups,
  selectedColumns,
  setSelectedColumns,
}: ColumnTabProps) {
  const [isChecked, setIsChecked] = useState<boolean>(true);

  const [totalVotes, setTotalVotes] = useState(0);
  const [total, setTotal] = useState(0);

  const updateRetrospectiveSettings = useUpdateRetrospectiveSettings();

  /*const onUpdateRetrospectiveSettings = useCallback(
    (value: any) => {
      void (async () => {
        try {
          const promise = updateRetrospectiveSettings(
            organizationId,
            retrospective.id,
            'selectedColumns',
            value,
            retrospective.name,
          );
        } catch (e) {
          console.error('Error on onUpdateRetrospectiveSettings', e);
        }
      })();
    },
    [updateRetrospectiveSettings, organizationId, retrospective],
  );*/

  useEffect(() => {
    let totalVotes = 0;
    let total = 0;
    if (comments.length > 0) {
      comments.forEach((item) => {
        totalVotes += item.votes;
      });

      total = comments.length;
    }
    if (groups && groups?.length > 0) {
      groups.forEach((item) => {
        totalVotes += item.votes;
      });
      total += groups.length;
    }
    setTotalVotes(totalVotes);
    setTotal(total);
  }, [comments, groups]);

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsChecked(event.target.checked);
  };

  useEffect(() => {
    const selectedColumn = retrospective.selectedColumns
      ? retrospective.selectedColumns
      : selectedColumns;

    const columnExists = selectedColumn.some(
      (col: any) => col.id === column.id,
    );

    if (isChecked && !columnExists) {
      const updatedColumns = [...selectedColumn, column];
      updatedColumns.sort((a, b) => (a.order || 0) - (b.order || 0));
      setSelectedColumns(updatedColumns);
    } else if (!isChecked && columnExists) {
      const updatedColumns = selectedColumn.filter(
        (col: Structure) => col.id !== column.id,
      );
      updatedColumns.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
      setSelectedColumns(updatedColumns);
    }
  }, [isChecked]);

  return (
    <div className="flex w-[400px] justify-between items-center bg-orange-500 text-white rounded-[5px] p-2.5 ">
      <div className="flex items-center space-x-2">
        <div className="inline-flex items-center">
          <label
            className="relative flex items-center rounded-full cursor-pointer"
            htmlFor="checkbox-1"
            data-ripple-dark="true"
          >
            <input
              checked={isChecked}
              type="checkbox"
              className="before:content[''] peer bg-white border border-black rounded-sm relative h-5 w-5 cursor-pointer appearance-none transition-all before:absolute before:top-2/4 before:left-2/4 before:block before:h-12 before:w-12 before:-translate-y-2/4 before:-translate-x-2/4 before:bg-blue-gray-500 before:opacity-0 before:transition-opacity checked:border-rose-700 checked:bg-rose-700 checked:before:bg-white"
              id="checkbox-1"
              onChange={handleCheckboxChange}
            />

            <div className="absolute text-white transition-opacity opacity-0 pointer-events-none top-2/4 left-2/4 -translate-y-2/4 -translate-x-2/4 peer-checked:opacity-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <g id="check">
                  <path
                    id="Vector"
                    d="M13.3337 4L6.00033 11.3333L2.66699 8"
                    stroke="#FAFAFA"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              </svg>
            </div>
          </label>
        </div>
        <p className="text-2xl font-extrabold">{column.name}</p>
      </div>
      <div className="flex space-x-2.5">
        <div className="flex bg-[#F4F4F5] text-black px-4 py-2 space-x-2 rounded-md w-max">
          <Image src={thumbsUp} alt="thumbsUp" />
          <p>{totalVotes}</p>
        </div>
        <div className="flex bg-white text-black px-4 py-2 space-x-2 rounded-md w-max">
          <Image src={chat} alt="chat" />
          <p>{total}</p>
        </div>
      </div>
    </div>
  );
}
