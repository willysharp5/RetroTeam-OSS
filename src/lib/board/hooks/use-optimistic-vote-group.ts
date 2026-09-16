import { useCallback } from 'react';
import useVoteGroup from './use-vote-group';

interface VoteGroupProps {
  id: string;
  organizationId: string;
  retrospectiveId: string;
  userId: string;
  userVotes: number;
}

/**
 * @name useOptimisticVoteGroup
 * @description Hook to handle optimistic vote for groups - INSTANTANEOUS TOTAL
 */
export function useOptimisticVoteGroup() {
  const { trigger: voteGroup } = useVoteGroup();

  const voteWithOptimisticUpdate = useCallback(async (
    groupId: string,
    currentGroup: any,
    newUserVotes: number,
    currentUser: string,
    organizationId: string,
    retrospectiveId: string,
    updateTask: (id: string, group: any) => void,
    onSuccess?: () => void,
    onError?: () => void,
    maxVotesGlobal?: number, // Global vote limit
    myTotalVotes?: number // Total votes of the user in all cards
  ) => {

    // Calculate the new total votes for this user
    const currentUserVotes = currentGroup?.voters?.[currentUser]?.votes || 0;
    const voteDifference = newUserVotes - currentUserVotes;
    const newTotalUserVotes = (myTotalVotes || 0) + voteDifference;

    // Check global vote limit in the hook
    if (maxVotesGlobal && newTotalUserVotes > maxVotesGlobal) {
      return;
    }

    // Optimistic update IMMEDIATELY
    const optimisticUpdate = {
      ...currentGroup,
      voters: {
        ...currentGroup.voters,
        [currentUser]: {
          votes: newUserVotes,
        },
      },
      lastUpdated: new Date().toISOString(),
    };

    // Update UI IMMEDIATELY
    updateTask(groupId, optimisticUpdate);

    // Call onSuccess immediately
    onSuccess?.();

    const body: VoteGroupProps = {
      id: groupId,
      organizationId: organizationId,
      retrospectiveId: retrospectiveId,
      userId: currentUser,
      userVotes: newUserVotes,
    };

    // Server call in background (without waiting for response)
    voteGroup(body)
      .then((res) => {
        console.log('Group vote updated in background');
      })
      .catch((e) => {
        console.log('ERROR voting group (background):', e);
        // Do not revert changes, keep optimistic
      });
  }, [voteGroup]);

  return {
    voteWithOptimisticUpdate,
  };
} 