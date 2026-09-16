import {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from 'react';
import { useAuth } from 'reactfire';
import toaster from 'react-hot-toast';

import { useRouter } from 'next/router';

import { Comment, Group, Tag } from '~/lib/board/types/types';
import { useCurrentOrganization } from '~/lib/organizations/hooks/use-current-organization';

import { Id, Task } from '~/lib/actions/types/actions';

import Board from '~/components/board/GroupPage/board/Board';

import PageLoadingIndicator from '~/core/ui/PageLoadingIndicator';
import { Rules } from '~/lib/rules/types';
import { TeamMembers } from '~/lib/teams/types/teams';
import { Retrospectives } from '~/lib/retrospectives/types/retrospectives';

import useUpdateAllCommentsGroup from '~/lib/board/hooks/use-update-all-comments-group';
import useDeleteAllGroups from '~/lib/board/hooks/use-delete-all-groups';

import useFetchRules from '~/lib/server/rules/get-rules';
import useCreateGroup from '~/lib/board/hooks/use-create-group';
import AddAIGrouping from '~/lib/board/hooks/use-add-ai-grouping';

import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { useUpdateOrganizationAICounter } from '~/lib/organizations/hooks/use-update-ai-counter';
import { useUpdateRetrospectiveSettings } from '~/lib/retrospectives/hooks/use-update-retrospective-settings';
import useGetGroupingComments from '~/lib/ai/use-get-grouping-comments';

interface GroupPageProps {
  tags: Tag[];
  groups: Group[];
  setGroups: (group: any) => void;
  comments: Comment[];
  allComments: any;
  updateTask: (id: string, content: Comment) => void;
  deleteTask: (id: Id) => void;
  detatchTask: (task: Comment) => void;
  detatchAllTask: (groupId: Id) => void;
  createGroup: (content: Group) => void;
  onUpdateGroup: (group: Group, order: number, status: string) => void;
  hideGroupTasks: (id: Id, group: string) => void;
  loading: boolean;
  updateGroups: (id: string, content: Group) => void;
  rules: Rules;
  currentUserRole: number;
  numberVotes: number;
  teamMembers: TeamMembers[];
  retrospective: Retrospectives;
  createTask: (task: Comment) => void;
  aiRemaining: number;
  setIsProcessing: (isProsseing: boolean) => void;
}

const GroupPage = forwardRef(function GroupPage(
  {
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
    teamMembers,
    retrospective,
    allComments,
    createTask,
    aiRemaining,
    setIsProcessing,
  }: GroupPageProps,
  ref,
) {
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

  const [aiGrouping, setAIGrouping] = useState<any>([]);

  useEffect(() => {
    if (comments) {
      setTasks(comments);
    }
  }, [comments]);

  useEffect(() => {
    if (retrospective) {
      setRetrospectiveData(retrospective);
      setLoadingAI(retrospective?.loadingAIGrouping as boolean);
    }
  }, [retrospective]);

  // AI GROUPING FUNCTIONS

  const [updateOrganizationAICounter] =
    useUpdateOrganizationAICounter();

  const [showRegenerateWarning, setShowRegenerateWarning] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiCanceled, setAiCanceled] = useState(false);
  const [showAiWordError, setShowAiWordError] = useState(false);

  const { updateAllDocuments: updateAllComentsGroup } =
    useUpdateAllCommentsGroup(organizationId, retrospectiveId);

  const { deleteAllDocuments: deleteAllGroups } = useDeleteAllGroups(
    organizationId,
    retrospectiveId,
  );

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: aiRules } = useFetchRules('ai');

  const { trigger: addGroupData } = useCreateGroup();
  const { trigger: addAiGroupingData } = AddAIGrouping();

  const aiCanceledRef = useRef(aiCanceled);

  useEffect(() => {
    aiCanceledRef.current = aiCanceled;
  }, [aiCanceled]);

  const onCreateAiGrouping = async (groupingData: any) => {
    const body = {
      retrospectiveId: retrospective.id,
      organization: organizationId,
    };

    addAiGroupingData(body)
      .then((res: any) => {})
      .catch((e: any) => {
        console.error('ERROR onCreateAIGrouping', e);
      });

    return { groupingData, grouped: false };
  };

  const updateRetrospectiveSettings = useUpdateRetrospectiveSettings();

  const onUpdateRetrospectiveLoadingAI = useCallback(
    (value: any) => {
      void (async () => {
        try {
          updateRetrospectiveSettings(
            organizationId,
            retrospectiveId,
            'loadingAIGrouping',
            value,
            retrospective.name,
          );
        } catch (e) {
          console.error('ERROR on onUpdateRetrospectiveLoadingAI', e);
        }
      })();
    },
    [
      updateRetrospectiveSettings,
      organizationId,
      retrospectiveId,
      retrospective,
    ],
  );

  const { trigger: GenerateAIGroupAndTags } = useGetGroupingComments();

  const groupCommentsAI = useCallback(async () => {
    if (aiCanceledRef.current) {
      setAiCanceled(false);
      return;
    }

    try {
      const r: any = await GenerateAIGroupAndTags({
        comments: allComments,
        retrospective: retrospective,
        totalAiTokens: aiRules.totalAiTokens,
      });
      const response = r.data;
      if (aiCanceledRef.current) {
        setAiCanceled(false);
        return;
      }

      if (r.error) {
        onUpdateRetrospectiveLoadingAI(false);
        setShowAiWordError(true);
        return;
      }

      setAIGrouping(response);

      return await onCreateAiGrouping(response);
    } catch (error) {
      console.error('Error in groupCommentsAI:', error);
    }
  }, [
    retrospective,
    aiRules.totalAiTokens,
    setShowAiWordError,
    setAIGrouping,
    onCreateAiGrouping,
    allComments,
    onUpdateRetrospectiveLoadingAI,
    GenerateAIGroupAndTags,
  ]);

  const formatComments = (groupingData: any) => {
    const response: any[] = [];

    groupingData?.forEach((generalGroup: any) => {
      generalGroup?.Groups.forEach((group: any) => {
        if (!group.rejected && !group.grouped) {
          const groupComments: any[] = [];
          let totalVotes = 0;

          group.Comments.forEach((comment: any) => {
            const matchedComment = allComments.find(
              (item: Task) => item.id === comment.id,
            );
            if (matchedComment) {
              groupComments.push({
                id: matchedComment.id,
                votes: matchedComment.votes,
                originalData: matchedComment,
              });
              totalVotes += matchedComment.votes || 0;
            }
          });

          if (groupComments.length > 1) {
            response.push({
              title: group['Group Title'],
              tags: group.Tags,
              comments: groupComments,
              votes: totalVotes,
            });
          }
        }
      });
    });

    return response;
  };

  const groupComments = useCallback(
    _.debounce(async (aiGrouping) => {
      const AIGroups = formatComments(aiGrouping);

      if (AIGroups.length === 0) {
        toaster.error('No groups found. Please try again');
        setAiCanceled(true);
        return;
      }

      const invalidGroupCount = AIGroups.filter(
        (AIGroup) => !AIGroup.comments || AIGroup.comments.length <= 1,
      ).length;

      if (invalidGroupCount === AIGroups.length) {
        toaster.error('Something went wrong, please try again');
        setAiCanceled(true);
        return;
      }

      await updateAllComentsGroup();
      await deleteAllGroups();

      for (const AIGroup of AIGroups) {
        const id = uuidv4();
        const name = AIGroup.title || 'Group Title';
        const tags = AIGroup.tags.map((tag: string) => ({
          id: uuidv4(),
          name: tag,
        }));

        const _comments = AIGroup.comments.map((comment: any) => {
          comment.originalData.group = id;
          return comment.originalData;
        });

        const status = AIGroup.comments[0].originalData.status;
        const groupData = {
          id,
          name,
          comments: _comments,
          order: _comments[0].order || 0,
          status,
          retrospectiveId,
          organizationId,
          aiGroup: true,
          tags: tags,
          votes: 0,
          voters: [],
        };

        try {
          await toaster.promise(addGroupData(groupData), {
            loading: 'Grouping comments',
            success: 'Comments have been grouped',
            error: 'Error grouping comments',
          });
        } catch (e) {
          console.error('ERROR onCreateGroup', e);
        }
      }

      await updateOrganizationAICounter(organizationId);
    }, 1000),
    [aiGrouping, retrospectiveId, organizationId, aiCanceled],
  );

  const onClickRegenerate = () => {
    setAiCanceled(false);
    setShowRegenerateWarning(true);
  };

  const onRegenerateGroupingAI = async () => {
    setShowRegenerateWarning(false);
    onUpdateRetrospectiveLoadingAI(true);

    setAiCanceled(false);
    const response = await groupCommentsAI();

    if (!response || !response.groupingData) {
      toaster.error('No grouping data found.');
      onUpdateRetrospectiveLoadingAI(false);
      return;
    }
    timeoutRef.current = setTimeout(async () => {
      try {
        await groupComments(response?.groupingData);

        setTimeout(() => onUpdateRetrospectiveLoadingAI(false), 8000);
      } catch (error) {
        console.error('Error during group regeneration:', error);
        toaster.error('An error occurred while regenerating groups.');
        setAiCanceled(true);
        onUpdateRetrospectiveLoadingAI(false);
      }
    }, 1000);
  };

  useImperativeHandle(ref, () => ({
    onRegenerateAIButtonHandler() {
      setAiCanceled(false);
      if (allComments.length > 0) {
        if (groups.length > 0) {
          onClickRegenerate();
        } else {
          onRegenerateGroupingAI();
        }
      } else {
        toaster.error('There are no comments to group');
      }
    },
  }));

  if (loading) {
    return <PageLoadingIndicator>Loading board...</PageLoadingIndicator>;
  }

  return (
    <Board
      teamMembers={teamMembers}
      organizationId={organizationId}
      retrospectiveId={retrospectiveId}
      teamId={teamId}
      updateTask={updateTask}
      deleteTask={deleteTask}
      detatchTask={detatchTask}
      detatchAllTask={detatchAllTask}
      createGroup={createGroup}
      hideGroupTasks={hideGroupTasks}
      setTasks={setTasks}
      setIsProcessing={setIsProcessing}
      setGroups={setGroups}
      tasks={tasks}
      structure={retrospectiveData.structure}
      retrospective={retrospective}
      groups={groups}
      tags={tags}
      currentUser={currentUser}
      onUpdateGroup={onUpdateGroup}
      updateGroups={updateGroups}
      rules={rules}
      currentUserRole={currentUserRole}
      numberVotes={numberVotes}
      setShowAiWordError={setShowAiWordError}
      showAiWordError={showAiWordError}
      aiRules={aiRules}
      setLoadingAI={onUpdateRetrospectiveLoadingAI}
      aiCanceled={aiCanceled}
      setAiCanceled={setAiCanceled}
      timeoutRef={timeoutRef}
      groupCommentsAI={groupCommentsAI}
      groupComments={groupComments}
      loadingAI={loadingAI}
      setShowRegenerateWarning={setShowRegenerateWarning}
      onRegenerateGroupingAI={onRegenerateGroupingAI}
      showRegenerateWarning={showRegenerateWarning}
      createTask={createTask}
      aiRemaining={aiRemaining}
    ></Board>
  );
});

export default GroupPage;
