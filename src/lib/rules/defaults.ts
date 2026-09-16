import { Rules } from './types';

/**
 * @name DEFAULT_RULES
 * @description Permissive defaults for every application rule.
 *
 * Rules live in the Firestore `rules` collection, one document per section
 * (`organizations`, `boards`, `retrospectives`, `users`, `ai`). A fresh
 * self-hosted install has no such documents, so these defaults are merged
 * underneath whatever Firestore returns — see `useFetchRules`.
 *
 * They are intentionally permissive: this is an open-source build with no paid
 * tier, so nothing here should ever act as a gate. Override any of them by
 * creating a document in the `rules` collection with a matching `section`
 * field and only the properties you want to change.
 */
export const DEFAULT_RULES: Omit<Rules, 'section'> = {
  /***-----ORGANIZATION---------****/
  // Governance, not billing: raise or lower it in the `rules` collection.
  maxAdmins: 100,

  /***--------BOARD---------****/
  allowMembersComment: true,
  allowMembersGroup: true,
  allowMembersViewComments: true,
  allowMembersGrabCards: true,
  allowMembersGrabCardsOnGroupStage: true,
  allowFacilitatorsGrabCards: true,
  allowFacilitatorsGrabCardsOnGroupStage: true,

  // Board locked rules: a locked board is read-only for members, while
  // facilitators keep control of it.
  boardLockedFacilitatorCreateComments: true,
  boardLockedFacilitatorDeleteComments: true,
  boardLockedFacilitatorGrabCards: true,
  boardLockedFacilitatorUpdateComments: true,
  boardLockedFacilitatorVoteCards: true,
  boardLockedMemberCreateComments: false,
  boardLockedMemberDeleteComments: false,
  boardLockedMemberGrabCards: false,
  boardLockedMemberUpdateComments: false,
  boardLockedMemberVoteCards: false,

  // Once a retrospective is finished it becomes a record of the session, so
  // it is read-only by default for everyone.
  allowCreateCardsOnceFinished: false,
  allowUpdateCardsOnceFinished: false,
  allowDeleteCardsOnceFinished: false,
  allowVoteCardsOnceFinished: false,
  allowMembersGrabCardsOnceFinished: false,
  allowMembersCreateCardsOnceFinished: false,
  allowMembersGrabActionsCardsOnceFinished: false,
  allowMembersCreateActionCardsOnceFinished: false,
  allowMembersUpdateActionCardsOnceFinished: false,
  allowMembersDeleteActionCardsOnceFinished: false,

  expirationDay: 30,

  /***-----RETROSPECTIVES---------**** */
  canArchiveCompletedRetrospective: true,
  canArchiveUncompletedRetrospective: true,
  canDeleteCompletedRetrospective: true,
  canDeleteUncompletedRetrospective: true,

  /***--------USERS--------- ****/
  expireAnonymousAccounts: 30,

  /******AI *******/
  analyzeLastRetrospectives: 5,
  groupingAI: true,
  useAI: true,
  totalAiTokens: 4096,
};
