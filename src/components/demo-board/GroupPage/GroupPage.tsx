import { useState, useEffect, forwardRef } from 'react';
import { useAuth } from 'reactfire';

import { Comment, Group, Tag } from '~/lib/board/types/types';

import { Id } from '~/lib/actions/types/actions';

import Board from '~/components/demo-board/GroupPage/board/Board';

import PageLoadingIndicator from '~/core/ui/PageLoadingIndicator';

import { TeamMembers } from '~/lib/teams/types/teams';
import { Retrospectives } from '~/lib/retrospectives/types/retrospectives';

import _ from 'lodash';

interface GroupPageProps {
  tags: Tag[];
  groups: Group[];
  setGroups: (group: any) => void;
  comments: Comment[];
  updateTask: (id: string, content: Comment) => void;
  deleteTask: (id: Id) => void;
  detatchTask: (task: Comment) => void;
  detatchAllTask: (groupId: Id) => void;
  createGroup: (content: Group) => void;
  onUpdateGroup: (group: Group, order: number, status: string) => void;
  hideGroupTasks: (id: Id, group: string) => void;
  loading: boolean;
  updateGroups: (id: string, content: Group) => void;
  showAuthors: boolean;
  numberVotes: number;
  teamMembers: TeamMembers[];
  retrospective: Retrospectives;
  createTask: (task: Comment) => void;
  setIsProcessing: (isProsseing: boolean) => void;
  isProcessing: boolean;
  isSuperAdmin: boolean;
}

const GroupPage = forwardRef(function GroupPage({
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
  showAuthors,
  numberVotes,
  teamMembers,
  retrospective,
  createTask,
  setIsProcessing,
  isProcessing,
  isSuperAdmin,
}: GroupPageProps, ref) {
  
  const [tasks, setTasks] = useState<Comment[]>([]);
  const [retrospectiveData, setRetrospectiveData] = useState<any>([]);

  useEffect(() => {
    if (comments) {
      setTasks(comments);
    }
  }, [comments]);

  useEffect(() => {
    if (retrospective) {
      setRetrospectiveData(retrospective);
    }
  }, [retrospective]);


  if (loading) {
    return <PageLoadingIndicator>Loading board...</PageLoadingIndicator>;
  }

  return (
    <Board
      teamMembers={teamMembers}
      updateTask={updateTask}
      deleteTask={deleteTask}
      detatchTask={detatchTask}
      detatchAllTask={detatchAllTask}
      createGroup={createGroup}
      hideGroupTasks={hideGroupTasks}
      isProcessing={isProcessing}
      setIsProcessing={setIsProcessing}
      setGroups={setGroups}
      tasks={tasks}
      structure={retrospectiveData.structure}
      groups={groups}
      tags={tags}
      onUpdateGroup={onUpdateGroup}
      updateGroups={updateGroups}
      numberVotes={numberVotes}
      createTask={createTask}
      isSuperAdmin={isSuperAdmin}
      retrospective={retrospectiveData}
      showAuthors={showAuthors}
    ></Board>
  );
});

export default GroupPage;
