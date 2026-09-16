
import { MembershipRole } from "~/lib/organizations/types/membership-role";
import { Retrospectives } from "~/lib/retrospectives/types/retrospectives";
import { Rules } from "~/lib/rules/types";

export const boardPermissions = (retrospective: Retrospectives, rules: Rules, currentUserRole: number, comment: any, userId: string, isAnonymous: boolean, isAction: boolean) => {
    let isAllowedToCreate = false;
    let isAllowedToUpdate = false;
    let isAllowedToDelete = false;
    let isAllowedToGrab = false;
    let isAllowedToVote = false;
    let isAllowedToGrabOnGroupStage = false;
    let isDoneVoting = false;

    if (retrospective && rules) {

        const member = (retrospective.members as unknown as Record<string, { voteDone?: boolean }> | undefined)?.[userId];
        isDoneVoting = Boolean(member?.voteDone);

        if (retrospective.finished) {
            if (isAnonymous) {
                isAllowedToCreate = false
                isAllowedToUpdate = rules.allowUpdateCardsOnceFinished;
                isAllowedToDelete = rules.allowDeleteCardsOnceFinished;
                isAllowedToVote = rules.allowVoteCardsOnceFinished;
                isAllowedToGrab = rules.allowFacilitatorsGrabCards;
                isAllowedToGrabOnGroupStage = rules.allowFacilitatorsGrabCards;
            } else {
                if (currentUserRole === MembershipRole.Facilitator) {
                    isAllowedToCreate = rules.allowCreateCardsOnceFinished
                    isAllowedToUpdate = rules.allowUpdateCardsOnceFinished;
                    isAllowedToDelete = rules.allowDeleteCardsOnceFinished;
                    isAllowedToVote = rules.allowVoteCardsOnceFinished;
                    isAllowedToGrab = rules.allowFacilitatorsGrabCards;
                    isAllowedToGrabOnGroupStage = rules.allowFacilitatorsGrabCards;
                } else {
                    if (isAction) {
                        isAllowedToCreate = rules.allowMembersCreateActionCardsOnceFinished;
                        isAllowedToUpdate = rules.allowMembersUpdateActionCardsOnceFinished;
                        isAllowedToDelete = rules.allowMembersDeleteActionCardsOnceFinished;
                        isAllowedToGrab = rules.allowMembersGrabActionsCardsOnceFinished;
                        isAllowedToVote = false;
                    } else {
                        isAllowedToCreate = rules.allowMembersCreateCardsOnceFinished;
                        isAllowedToUpdate = false;
                        isAllowedToDelete = false;
                        isAllowedToGrab = rules.allowMembersGrabCardsOnceFinished;
                        isAllowedToVote = false;
                    }

                }
            }

        } else if (retrospective.locked) {
            if (currentUserRole === MembershipRole.Facilitator) {
                isAllowedToCreate = rules.boardLockedFacilitatorCreateComments;
                isAllowedToGrab = rules.boardLockedFacilitatorGrabCards;
                isAllowedToUpdate = rules.boardLockedFacilitatorUpdateComments;
                isAllowedToDelete = rules.boardLockedFacilitatorDeleteComments;
                isAllowedToVote = rules.boardLockedFacilitatorVoteCards;
                isAllowedToGrabOnGroupStage = rules.allowFacilitatorsGrabCards;
            } else {
                isAllowedToCreate = rules.boardLockedMemberCreateComments
                isAllowedToUpdate = rules.boardLockedMemberUpdateComments
                isAllowedToDelete = rules.boardLockedMemberDeleteComments;
                isAllowedToVote = rules.boardLockedMemberVoteCards;
                isAllowedToGrab = rules.boardLockedMemberGrabCards;
            }
        } else {
            if (currentUserRole === MembershipRole.Facilitator) {
                isAllowedToCreate = true;
                isAllowedToUpdate = true;
                isAllowedToDelete = true;
                isAllowedToGrab = rules.allowFacilitatorsGrabCards;
                isAllowedToVote = true;
                isAllowedToGrabOnGroupStage = rules.allowFacilitatorsGrabCardsOnGroupStage;

            } else {
                isAllowedToCreate = rules.allowMembersComment;
                if (comment && comment.author === userId) {
                    isAllowedToUpdate = true;
                    isAllowedToDelete = true;
                } else {
                    isAllowedToUpdate = false;
                    isAllowedToDelete = false;
                }

                isAllowedToGrab = rules.allowMembersGrabCards;
                isAllowedToGrabOnGroupStage = rules.allowMembersGrabCardsOnGroupStage;
                isAllowedToVote = true;
            }
        }
    }

    return {
        isAllowedToCreate,
        isAllowedToUpdate,
        isAllowedToDelete,
        isAllowedToGrab,
        isAllowedToVote,
        isAllowedToGrabOnGroupStage,
        isDoneVoting
    };
};