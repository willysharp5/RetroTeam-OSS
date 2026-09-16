import { useApiRequest } from '~/core/hooks/use-api';
import useSWRMutation from 'swr/mutation';
import { useRef, useCallback } from 'react';

interface VoteCommentProps {
  id: string;
  organizationId: string;
  retrospectiveId: string;
  userId: string;
  userVotes: number;
}

interface VoteCommentResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * @name useVoteComment
 * @description Update a group vote data using an HTTP request to the
 * group API endpoint.
 */
function useVoteComment() {
  const endpoint = `/api/board/vote-comment`;
  const fetcher = useApiRequest<VoteCommentResponse, VoteCommentProps>();

  return useSWRMutation(endpoint, (path, { arg: body }: { arg: any }) => {
    return fetcher({
      path,
      body,
      method: 'PUT',
    });
  });
}

/**
 * @name useOptimisticVote
 * @description Hook to handle optimistic vote - INSTANTANEOUS TOTAL
 */
export function useOptimisticVote() {
  const { trigger: voteComment } = useVoteComment();

  const voteWithOptimisticUpdate = useCallback(async (
    commentId: string,
    currentComment: any,
    newUserVotes: number,
    currentUser: string,
    organizationId: string,
    retrospectiveId: string,
    updateTask: (id: string, comment: any) => void,
    onSuccess?: () => void,
    onError?: () => void,
    maxVotesGlobal?: number, // Global vote limit
    myTotalVotes?: number // Total votes of the user in all cards
  ) => {

    // Calculate the new total votes for this user
    const currentUserVotes = currentComment?.voters?.[currentUser]?.votes || 0;
    const voteDifference = newUserVotes - currentUserVotes;
    const newTotalUserVotes = (myTotalVotes || 0) + voteDifference;

    // Check global vote limit in the hook
    if (maxVotesGlobal && newTotalUserVotes > maxVotesGlobal) {
      return;
    }

    // Optimistic update IMMEDIATELY
    const optimisticUpdate = {
      ...currentComment,
      voters: {
        ...currentComment.voters,
        [currentUser]: {
          votes: newUserVotes,
        },
      },
      lastUpdated: new Date().toISOString(),
    };

    // Update UI IMMEDIATELY
    updateTask(commentId, optimisticUpdate);

    // Call onSuccess immediately
    onSuccess?.();

    const body = {
      id: commentId,
      retrospectiveId: retrospectiveId,
      organizationId: organizationId,
      userId: currentUser,
      userVotes: newUserVotes,
    };

    // Server call in background (without waiting for response)
    voteComment(body)
      .then((res) => {
        console.log('Vote updated in background');
      })
      .catch((e) => {
        console.log('ERROR voting comment (background):', e);
        // Do not revert changes, keep optimistic
      });
  }, [voteComment]);

  return {
    voteWithOptimisticUpdate,
  };
}

export default useVoteComment;
