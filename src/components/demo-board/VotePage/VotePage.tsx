import { useState, useEffect } from 'react';

import { Comment, Group, Tag } from '~/lib/board/types/types';

import { Id } from '~/lib/actions/types/actions';

import { Retrospectives } from '~/lib/retrospectives/types/retrospectives';
import { Structure } from '~/lib/structures/types/structures';
import Board from './board/Board';

interface VotePageProps {
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
  numberVotes: number;
  showSettingsModal: boolean;
  setShowSettingsModal: (show: boolean) => void;
  onUpdateBoardSettings: (type: string, value: any, from: string) => void;
  voterNumber: number;
  settingVotes: number;
  setSettingVotes: (vote: number) => void;
  retrospective: Retrospectives;
  totalVotes: number;
  createTask: (task: Comment) => void;
  updateGroups : (id: string, content: Group) =>void;
  loadingVotes: boolean;
  isSuperAdmin: boolean;
  showAuthors: boolean;
}

export default function VotePage({
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
  numberVotes,
  showSettingsModal,
  setShowSettingsModal,
  onUpdateBoardSettings,
  voterNumber,
  settingVotes,
  setSettingVotes,
  retrospective,
  totalVotes,
  createTask,
  updateGroups,
  loadingVotes,
  isSuperAdmin,
  showAuthors
}: VotePageProps) {
  const [tasks, setTasks] = useState<Comment[]>([]);
  const [retrospectiveData, setRetrospectiveData] = useState<any>([]);

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

  return (
    <Content
      retrospective={retrospective}
      tasks={tasks}
      groups={groups}
      data={tasks}
      setTasks={setTasks}
      setGroups={setGroups}
      updateTask={updateTask}
      deleteTask={deleteTask}
      detatchTask={detatchTask}
      detatchAllTask={detatchAllTask}
      createGroup={createGroup}
      addCommentGroup={addCommentGroup}
      hideGroupTasks={hideGroupTasks}
      structure={retrospectiveData.structure}
      tags={tags}
      onUpdateGroup={onUpdateGroup}
      numberVotes={numberVotes}
      showSettingsModal={showSettingsModal}
      setShowSettingsModal={setShowSettingsModal}
      onUpdateBoardSettings={onUpdateBoardSettings}
      voteNumber={voterNumber}
      settingVotes={settingVotes}
      setSettingVotes={setSettingVotes}
      totalVotes={totalVotes}
      createTask={createTask}
      updateGroups={updateGroups}
      loadingVotes={loadingVotes}
      isSuperAdmin={isSuperAdmin}
      showAuthors={showAuthors}
    />
  );
}

interface ContentProps {
  retrospective: Retrospectives;
  tasks: Comment[];
  groups?: any[] | null;
  data: any;
  setTasks: (Task: Comment[]) => void;
  setGroups: (Group: Group[]) => void;
  updateTask: (id: string, content: Comment) => void;
  deleteTask: (id: string) => void;
  detatchTask: (content: Comment) => void;
  detatchAllTask: (groupId: Id) => void;
  createGroup: (group: Group) => void;
  onUpdateGroup: (group: Group, order: number, status: string) => void;
  addCommentGroup: (id: string, comment: Comment) => void;
  hideGroupTasks: (id: string, id2: string) => void;
  structure?: Structure[];
  tags?: Tag[];
  numberVotes: number;
  showSettingsModal?: boolean;
  setShowSettingsModal?: (show: boolean) => void;
  onUpdateBoardSettings?: (type: string, value: any, from: string) => void;
  voteNumber?: number;
  settingVotes?: number;
  setSettingVotes?: (vote: number) => void;
  totalVotes: number;
  createTask: (task: Comment) => void;
  updateGroups : (id: string, content: Group) =>void;
  loadingVotes: boolean;
  isSuperAdmin: boolean;
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
  structure,
  retrospective,
  tags,
  setGroups,
  onUpdateGroup,
  showSettingsModal,
  setShowSettingsModal,
  onUpdateBoardSettings,
  voteNumber,
  settingVotes,
  setSettingVotes,
  totalVotes,
  createTask,
  updateGroups,
  loadingVotes,
  isSuperAdmin,
  showAuthors
}: ContentProps) {
  const [numberVotes, setNumberVotes] = useState(5);

  useEffect(() => {
    if (retrospective && typeof retrospective.votes === 'number') {
      setNumberVotes(retrospective.votes);
    }
  }, [retrospective]);

  return (
    <div className="space-y-8">
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
        tasks={tasks}
        structure={structure}
        retrospective={retrospective}
        groups={groups}
        tags={tags}
        onUpdateGroup={onUpdateGroup}
        showSettingsModal={showSettingsModal}
        setShowSettingsModal={setShowSettingsModal}
        onUpdateBoardSettings={onUpdateBoardSettings}
        voteNumber={voteNumber}
        settingVotes={settingVotes}
        setSettingVotes={setSettingVotes}
        myTotalVotes={totalVotes}
        createTask={createTask}
        updateGroups={updateGroups}
        totalVotes={totalVotes}
        loadingVotes={loadingVotes}
        isSuperAdmin={isSuperAdmin}
        showAuthors={showAuthors}
      ></Board>
    </div>
  );
}
