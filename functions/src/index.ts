import { initializeFirebaseAdmin } from './firebaseAdmin';

import { CommentUpdate, GroupingCreate, GroupingUpdate, RetrospectiveCreate, RetrospectiveDelete, RetrospectiveUpdate } from './retrospectives';
import { ActionCreate, ActionDelete, ActionUpdate, BoardActionCreate, BoardActionDelete, BoardActionUpdate } from './actions';
import { OrganizationCreate, OrganizationDelete, OrganizationMemberDelete, OrganiztionUpdate } from './organizations';
import { UserCreate, UserDelete, UserUpdate } from './users';
import { TeamCreate, TeamDelete } from './teams';

initializeFirebaseAdmin();

/******************USERS FUNCTIONS*******************************/

export const onUserCreate = UserCreate;

export const onUserUpdate = UserUpdate;

export const onUserDelete = UserDelete;

/******************RETROSPECTIVES FUNCTIONS*******************************/

export const onRetrospectiveCreate = RetrospectiveCreate;

export const onRetrospectiveUpdate = RetrospectiveUpdate;

export const onRetrospectiveDelete = RetrospectiveDelete;

export const onGroupingCreate = GroupingCreate;

export const onGroupingUpdate = GroupingUpdate;

export const onCommentUpdate = CommentUpdate;

/******************ORGANIZATION ACTIONS FUNCTIONS*************************/

export const onActionCreate = ActionCreate;

export const onActionUpdate = ActionUpdate;

export const onActionDelete = ActionDelete;

/******************BOARD ACTIONS FUNCTIONS*******************************/

export const onBoardActionCreate = BoardActionCreate;

export const onBoardActionUpdate = BoardActionUpdate;

export const onBoardActionDelete = BoardActionDelete;


/************************ORGANIZATION FUNCTIONS **************************/

export const onOrganizationCreate = OrganizationCreate;

export const onOrganiztionUpdate = OrganiztionUpdate;

export const onOrganizationDelete = OrganizationDelete;

export const onOrganizationMemberDelete = OrganizationMemberDelete

/***********************TEAMS FUNCTIONS ************************** */

export const onTeamCreate = TeamCreate;

export const onTeamDelete = TeamDelete;
