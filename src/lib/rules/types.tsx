export interface Rules {
  /***-----ORGANIZATION---------****/
  maxAdmins: number; //Maxium number of admins on an organization

  /***--------BOARD---------****/
  // General Member Rules During a Retrospective - For when the board is not blocked and not finished
  allowMembersComment: boolean; // Allows member roles to create comments on Group, Vote and Action section

  allowMembersGroup: boolean; //Allows member roles to group cards
  allowMembersViewComments: boolean; //Allows member roles to view the comments of all users on Capture section
  allowMembersGrabCards: boolean; //Allows member roles to move cards on Capture, Vote and Action stage
  allowMembersGrabCardsOnGroupStage: boolean; //Allows member roles to move cards on Group stage
  // FACILITATORS
  allowFacilitatorsGrabCards: boolean; //Allows facilitators to grab cards on Capture, Vote and Action stage
  allowFacilitatorsGrabCardsOnGroupStage: boolean; // Allow facilitators to grab cards on Group stage

  // Board locked rules
  boardLockedFacilitatorCreateComments: boolean;
  boardLockedFacilitatorDeleteComments: boolean;
  boardLockedFacilitatorGrabCards: boolean;
  boardLockedFacilitatorUpdateComments: boolean;
  boardLockedFacilitatorVoteCards: boolean;
  boardLockedMemberCreateComments: boolean;
  boardLockedMemberDeleteComments: boolean;
  boardLockedMemberGrabCards: boolean;
  boardLockedMemberUpdateComments: boolean;
  boardLockedMemberVoteCards: boolean;
  // When a Retrospective End - The rules
  allowCreateCardsOnceFinished: boolean; //Allows create cards once a retrospective is finished (Facilitators)
  allowUpdateCardsOnceFinished: boolean; //Allows update cards once a retrospective is finished (Facilitators)
  allowDeleteCardsOnceFinished: boolean; //Allows delete cards once a retrospective is finished (Facilitators)
  allowVoteCardsOnceFinished: boolean; //Allows vote cards once a retrospective is finished (Facilitators)
  allowMembersGrabCardsOnceFinished: boolean; //Allow grab cards once a retrospective is finished (Members)
  allowMembersCreateCardsOnceFinished: boolean; //Allow create cards once retrospective is finished (Members)
  allowMembersGrabActionsCardsOnceFinished: boolean; //Allow grab action cards once retrospective is finished (Members)
  allowMembersCreateActionCardsOnceFinished: boolean; //Allow create action cards once retrospective is finished (Members)
  allowMembersUpdateActionCardsOnceFinished: boolean; //Allow update action cards once retrospective is finished (Members)
  allowMembersDeleteActionCardsOnceFinished: boolean; //Allow update action cards once retrospective is finished (Members)
  //Retrospective Board Rule
  expirationDay: number; //Expiration days for board

  /***-----RETROSPECTIVES---------**** */
  canArchiveCompletedRetrospective: boolean;
  canArchiveUncompletedRetrospective: boolean;
  canDeleteCompletedRetrospective: boolean;
  canDeleteUncompletedRetrospective: boolean;

  /***--------USERS--------- ****/
  expireAnonymousAccounts: number;

  /******AI *******/
  analyzeLastRetrospectives: number;
  groupingAI: boolean;
  useAI: boolean;
  totalAiTokens: number;
  section: string;
}
