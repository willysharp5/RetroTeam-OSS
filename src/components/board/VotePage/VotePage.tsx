import { useState, useEffect } from 'react';

import { Comment, ContentProps, Group, Tag } from '~/lib/board/types/types';
import { useCurrentOrganization } from '~/lib/organizations/hooks/use-current-organization';

import Board from '~/components/board/VotePage/board/Board';
import { Id } from '~/lib/actions/types/actions';

import { useRouter } from 'next/router';
import { useAuth } from 'reactfire';
import { Rules } from '~/lib/rules/types';
import { TeamMembers } from '~/lib/teams/types/teams';
import { Retrospectives } from '~/lib/retrospectives/types/retrospectives';

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
  onUpdateGroup: (group: Group, order: number,status: string) => void;
  hideGroupTasks: (id: Id, group: string) => void;
  loading: boolean;
  updateGroups: (id: string, content: Group) => void;
  rules: Rules;
  currentUserRole: number;
  numberVotes: number;
  showSettingsModal: boolean;
  setShowSettingsModal: (show: boolean) => void;
  onUpdateBoardSettings: (type: string, value: any, from:string) => void;
  voterNumber: number;
  setVoteNumber: (number: number) => void;
  teamMembers: TeamMembers[];
  settingVotes: number;
  setSettingVotes: (vote: number) => void;
  retrospective: Retrospectives;
  userId: string;
  totalVotes: number;
  createTask: (task: Comment)=>void;
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
  loading,
  onUpdateGroup,
  updateGroups,
  rules,
  currentUserRole,
  numberVotes,
  showSettingsModal,
  setShowSettingsModal,
  onUpdateBoardSettings,
  voterNumber,
  setVoteNumber,
  teamMembers,
  settingVotes,
  setSettingVotes,
  retrospective,
  userId,
  totalVotes,
  createTask
}: VotePageProps) {
  const organization = useCurrentOrganization();
  const organizationId = organization?.id as string;

  const router = useRouter();
  const { id } = router.query;

  const retrospectiveId = id as string;

  const auth = useAuth();
  const currentUser = auth.currentUser;

  const teamId = retrospective?.teamId as string;

  const [tasks, setTasks] = useState<Comment[]>([]);
  const [retrospectiveData, setRetrospectiveData] = useState<any>([]);

  const [loadingVotes, setLoadingVotes] = useState(false);

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
      teamMembers={teamMembers}
      organizationId={organizationId}
      teamId={teamId}
      retrospectiveId={retrospectiveId}
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
      currentUser={currentUser}
      onUpdateGroup={onUpdateGroup}
      updateGroups={updateGroups}
      rules={rules}
      currentUserRole={currentUserRole}
      numberVotes={numberVotes}
      showSettingsModal={showSettingsModal}
      setShowSettingsModal={setShowSettingsModal}
      onUpdateBoardSettings={onUpdateBoardSettings}
      voteNumber={voterNumber}
      setVoteNumber={setVoteNumber}
      settingVotes={settingVotes}
      setSettingVotes={setSettingVotes}
      userId={userId}
      totalVotes={totalVotes}
      createTask={createTask}
      loadingVotes={loadingVotes}
      setLoadingVotes={setLoadingVotes}
    />
  );
}

function Content({
  organizationId,
  teamId,
  retrospectiveId,
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
  teamMembers,
  structure,
  retrospective,
  tags,
  setGroups,
  currentUser,
  onUpdateGroup,
  updateGroups,
  rules,
  currentUserRole,
  showSettingsModal,
  setShowSettingsModal,
  onUpdateBoardSettings,
  voteNumber,
  setVoteNumber,
  settingVotes,
  setSettingVotes,
  userId,
  totalVotes,
  createTask,
  loadingVotes,
  setLoadingVotes
}: ContentProps) {
  const [numberVotes, setNumberVotes] = useState(5);
  const maxVotesGlobal = retrospective?.votes || 0; // Límite global desde retrospective

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
        teamMembers={teamMembers}
        comments={data}
        organizationId={organizationId}
        retrospectiveId={retrospectiveId}
        teamId={teamId}
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
        currentUser={currentUser}
        onUpdateGroup={onUpdateGroup}
        updateGroups={updateGroups}
        rules={rules}
        currentUserRole={currentUserRole}
        showSettingsModal={showSettingsModal}
        setShowSettingsModal={setShowSettingsModal}
        onUpdateBoardSettings={onUpdateBoardSettings}
        voteNumber={voteNumber}
        setVoteNumber={setVoteNumber}
        settingVotes={settingVotes}
        setSettingVotes={setSettingVotes}
        userId={userId}
        myTotalVotes={totalVotes}
        createTask={createTask}
        loadingVotes={loadingVotes}
        setLoadingVotes={setLoadingVotes}
        maxVotesGlobal={maxVotesGlobal}
      ></Board>
    </div>
  );
}
