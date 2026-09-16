import { Structure } from '~/lib/structures/types/structures';
import { Column, Id, Status, Task } from '../../actions/types/actions';
import { Retrospectives } from '../../retrospectives/types/retrospectives';
import { MembersListProps, TeamMembers } from '../../teams/types/teams';
import { Rules } from '~/lib/rules/types';
import { Organization } from '~/lib/organizations/types/organization';
import { Restrictions } from '~/lib/entitlements/types';

export type Comment = {
  title: string;
  date: any;
  userName: string;
  description: string;
  status: string;
  user: {
    name: string;
    lastName: string;
    fullName: string;
    id: string;
  };
  assignee: string;
  id: string;
  archive: boolean;
  order: number;
  team: string;
  author: string;
  group: string;
  votes: number;
  voters: any;
  notUpdate?: boolean;
};

export interface SettingsSidebarProps {
  setShowSettingsBar: (show: boolean) => void;
  onUpdateBoardSettings: (type: string, value: any, from: string) => void;
  onUpdateRetrospectiveSettings: (
    type: string,
    value: any,
    name: string,
  ) => void;
  authors: boolean;
  locked: boolean;
  access: string;
  groupWithAI: boolean;
  actionsWithAI: boolean;
  retrospective: Retrospectives;
  voteNumber: number;
  setVoteNumber: (number: number) => void;
  totalVotes: number;
  loading: boolean;
  showMembersComments: boolean;
}
export interface ResultsSidebarProps {
  setShowResultsBar: (show: boolean) => void;
  retrospective: Retrospectives;
  organizationId: string;
  teamId: string;
  userId:string;
  onUpdateBoardSettings: (type: string, value: any, from: string) => void;
}
export interface HeaderProps {
  selectedTab: number;
  retrospective: Retrospectives;
  setShowSettingsModal: (show: boolean) => void;
  showSettingsModal: boolean;
  currentUserRole: number;
  voteNumber: number;
  fetchBoard: () => void;
  organizationId: string;
  teamId: string;
  retrospectiveId: string;
  userId: any;
  aiRemaining: number;
  isAnonymous: boolean;
  canUseAI: boolean;
  handleRegenerateAIClick: () => void;
  comments: any;
  groups: any;
  onUpdateRoleMemberRequested: (type: string, value: any) => void;
}

export type Group = {
  aiGroup: boolean;
  name: string;
  users: any;
  comments: Comment[];
  members: any[];
  status: string;
  user: {
    name: string;
    lastName: string;
  };
  assignee: string;
  id: string;
  archive: boolean;
  order: number;
  team: string;
  author: string;
  group: string;
  tags: Tag[];
  votes: number;
  voters: any;
};

export interface GroupCardProps {
  group: Group;
  organizationId: string;
  teamId: string;
  retrospectiveId: string;
  deleteTask: (id: Id) => void;
  updateTask: (id: string, content: Comment) => void;
  retrospective: Retrospectives;
  overTask: string | null | undefined;
  activeTask: any;
  retroTeamTags: Tag[];
  overAGroup: any;
  currentUser: any;
  detatchTask: (content: Comment) => void;
  detatchAllTask: (groupId: Id) => void;
  active?: boolean;
  numberVotes: number;
  isVoting: boolean;
  isAction: boolean;
  voteNumber?: number;
  allowed: boolean;
  canGroup: boolean;
  rules: Rules;
  userId: string;
  currentUserRole: number;
  discardAIGrouping?: (group: any) => void;
  confirmAIGrouping: (group: any) => void;
  myTotalVotes?: number;
  maxVotesGlobal?: number; // Limite global de votos
  isDoneVoting?: boolean;
  loadingVotes?:boolean;
  setLoadingVotes?: (loading: boolean)=>void;
}

export interface Tag {
  name: string;
  id: string;
}
export interface ContentProps {
  organizationId: string;
  teamId: string;
  retrospectiveId: string;
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
  updateGroups: (id: string, group: Group) => void;
  onUpdateGroup: (group: Group, order: number, status: string) => void;
  addCommentGroup: (id: string, comment: Comment) => void;
  hideGroupTasks: (id: string, id2: string) => void;
  teamMembers: TeamMembers[] | any[] | null;
  structure?: Structure[];
  tags?: Tag[];
  currentUser: any;
  rules: Rules;
  currentUserRole: number;
  numberVotes: number;
  showSettingsModal?: boolean;
  setShowSettingsModal?: (show: boolean) => void;
  onUpdateBoardSettings?: (type: string, value: any, from: string) => void;
  voteNumber?: number;
  setVoteNumber?: (number: number) => void;
  settingVotes?: number;
  setSettingVotes?: (vote: number) => void;
  userId: string;
  aiRemaining?: number;
  totalVotes: number;
  createTask: (task: Comment)=>void;
  loadingVotes?:boolean;
  setLoadingVotes?: (loading: boolean)=>void;
}

export interface CaptureContentProps {
  organizationId: string;
  teamId: string;
  retrospectiveId: string;
  retrospective: Retrospectives;
  comments: any;
  groups: Group[];
  createTask: (Task: Comment) => void;
  updateTask: (id: string, content: Comment) => void;
  deleteTask: (id: string) => void;
  detatchTask: (content: Comment) => void;
  detatchAllTask: (groupId: Id) => void;
  onUpdateGroup: (group: Group, order: number, status: string) => void;
  teamMembers: TeamMembers[] | any[] | null;
  structure?: Structure[];
  tags: Tag[];
  currentUser: any;
  setGroups: (group: any) => void;
  updateGroups: (id: string, content: Group) => void;
  currentUserRole: number;
  numberVotes: number;
  rules: Rules;
  isSuperAdmin?:boolean;
  voteNumber?: number; // Total de votos del usuario en todas las cards
}

export interface ColumnContainerProps {
  column: BoardColumn;
  updateTask: (id: string, content: Comment) => void;
  deleteTask: (id: Id) => void;
  detatchTask: (content: Comment) => void;
  detatchAllTask: (id: Id) => void;
  organizationId: string;
  teamId: string;
  retrospectiveId: string;
  tasks: Comment[];
  groups: Group[];
  teamMembers: any[] | TeamMembers[] | null;
  retrospective: Retrospectives;
  tags: Tag[];
  currentUser: any;
  overTask?: string | null;
  activeTask?: Comment | null;
  overAGroup?: string | null;
  rules: Rules | any;
  currentUserRole: number;
  numberVotes: number;
  voteNumber?: any;
  setVoteNumber?: any;
  showCard: any;
  setShowCard: (card: any) => void;
  editCard: any;
  setEditCard: (card: any) => void;
  userId: string;
  boardData: any;
  discardAIGrouping?: (group: any) => void;
  confirmAIGrouping: (group: any) => void;
  showSettingsModal?: boolean
  isDoneVoting?: boolean;
  setIsDoneVoting?: (isDone: boolean)=>void;
  createTask: (content: Comment) => void;
  loadingVotes?:boolean;
  setLoadingVotes?: (loading: boolean)=>void;
  isSuperAdmin?: boolean;
  myTotalVotes?: number; // Total de votos del usuario en todas las cards
  maxVotesGlobal?: number; // Limite global de votos
}

export interface ActionPageProps {
  tags: Tag[];
  groups: Group[];
  setGroups: (group: Group[]) => void;
  comments: Comment[];
  allComments: Comment[] | any;
  updateTask: (id: string, content: Comment) => void;
  deleteTask: (id: Id) => void;
  detatchTask: (task: Comment) => void;
  detatchAllTask: (groupId: Id) => void;
  createGroup: (content: Group) => void;
  onUpdateGroup: (group: Group, order: number, status: string) => void;
  hideGroupTasks: (id: Id, group: string) => void;
  rules: Rules;
  currentUserRole: number;
  numberVotes: number;
  showSettingsModal: boolean;
  setShowSettingsModal: (show: boolean) => void;
  onUpdateBoardSettings: (type: string, value: any, from: string) => void;
  voterNumber: number;
  setVoteNumber: (number: number) => void;
  restrictions: Restrictions | any;
  retrospective: Retrospectives;
  aiRemaining: number;
  canUseAI: boolean;
  createTask: (task: Comment)=>void;
  organizationData: any;
}

export interface ColumnTabProps {
  organizationId: string;
  retrospective: Retrospectives;
  column: any;
  comments: Comment[];
  groups: Group[] | null | undefined;
  index: number;
  currentUserRole: number;
  selectedColumns: Structure[];
}

export interface ActionContentProps {
  organizationId: string;
  teamId: string;
  retrospectiveId: string;
  retrospective: Retrospectives;
  tasks: Comment[];
  groups?: any[] | null;
  data: any;
  setGroups: (Group: Group[]) => void;
  setActions: (Action: Task[]) => void;
  updateTask: (id: string, content: Comment) => void;
  deleteTask: (id: string) => void;
  detatchTask: (content: Comment) => void;
  detatchAllTask: (groupId: Id) => void;
  createGroup: (group: Group) => void;
  onUpdateGroup: (group: Group, order: number, status: string) => void;
  addCommentGroup: (id: string, comment: Comment) => void;
  hideGroupTasks: (id: string, id2: string) => void;
  createAction: (content: Task) => void;
  updateAction: (id: string, content: Task) => void;
  archiveAction: (id: string, archive: boolean) => void;
  deleteAction: (id: string) => void;
  teamMembers: TeamMembers[] | any[] | null;
  structure?: Structure[];
  tags?: Tag[];
  currentUser: any;
  rules: Rules;
  currentUserRole: number;
  numberVotes: number;
  showSettingsModal?: boolean;
  setShowSettingsModal?: (show: boolean) => void;
  onUpdateBoardSettings?: (type: string, value: any, from: string) => void;
  voteNumber?: number;
  setVoteNumber?: (number: number) => void;
  actions: Task[];
  subscriptionId: string;
  refetchTeamMembers: (search: string) => void;
  loadingMembers: boolean;
  aiData: any;
  remaining: number;
  getAiActions: () => void;
  restrictions: Restrictions;
  loadingAI: boolean;
  showAiWordError: boolean;
  setShowAiWordError: any;
  onCancelAI: () => void;
  canUseAI: boolean;
  createTask: (task: Comment)=>void;
  organizationData: any;
}

export interface ActionColumnContainerProps {
  column: BoardColumn;
  updateTask: (id: string, content: Comment) => void;
  deleteTask: (id: Id) => void;
  detatchTask: (content: Comment) => void;
  detatchAllTask: (id: Id) => void;
  archiveTask: (id: string, archive: boolean) => void;
  organizationId: string;
  teamId: string;
  retrospectiveId: string;
  tasks: Comment[];
  groups: Group[];
  teamMembers: TeamMembers[];
  retrospective: Retrospectives;
  tags: Tag[];
  currentUser: any;
  updateGroups: (id: string, content: Group) => void;
  overTask?: string | null;
  activeTask?: Comment | null;
  overAGroup?: string | null;
  rules: Rules | any;
  currentUserRole: number;
  numberVotes: number;
  voteNumber?: any;
  setVoteNumber?: any;
}

export interface ActionCardProps {
  action: Task;
  organizationId: string;
  deleteTask: (id: string) => void;
  updateTask: (id: string, content: Task) => void;
  archiveTask: (id: string, archive: boolean) => void;
  teamMembers: TeamMembers[];
  index: any;
  retrospectiveId: string;
  active: boolean;
  retrospective: Retrospectives;
  rules: Rules;
  currentUserRole: number;
  editCard: any;
  setEditCard: (card: any) => void;
  refetchTeamMembers: (search: string) => void;
  loadingMembers: boolean;
  organizationData: any;
}

export interface ActionContainerProps {
  column: Column;
  createAction: (task: Task) => void;
  updateAction: (id: string, task: Task) => void;
  deleteAction: (id: Id) => void;
  refetch: () => void;
  organizationId: string;
  teamId: string;
  archiveAction: (id: string, archive: boolean) => void;
  retrospectiveId: string;
  retrospective: Retrospectives;
  teamMembers: any;
  currentUserRole: number;
  actions: Task[];
  rules: Rules | any;
  showCard: any;
  setEditCard: (card: any) => void;
  editCard: any;
  refetchTeamMembers: (search: string) => void;
  loadingMembers: boolean;
  aiData?: any;
  remaining?: number;
  getAiActions?: () => void;
  restrictions?: Restrictions;
  loadingAI?: boolean;
  isBoard?: boolean;
  onCancelAI?: () => void;
  canUseAI?: boolean;
  currentUser: any;
  organizationData: any;
}

export interface ActionContainerCardProps {
  teamId: string;
  teamMembers: MembersListProps[];
  organizationId: string;
  retrospectiveId: string;
  textAreaRef: any;
  showCard: any;
  setShowCard: (show: any) => void;
  refetchTeamMembers: (search: string) => void;
  loadingMembers: boolean;
  column?: any;
  createAction: (content: Task) => void;
}

export interface ActionsPopoverProps {
  tasks: Task[];
  closeModalHandler: () => void;
  updateAction: (id: string, task: Task) => void;
  archiveAction: (id: string, archive: boolean) => void;
  deleteAction: (id: Id) => void;
  organizationId: string;
  teamMembers: any;
  retrospectiveId: string;
  rules: Rules | any;
  currentUserRole: number;
  retrospective: Retrospectives;
  setEditCard: (card: any) => void;
  editCard: any;
  refetchTeamMembers: (search: string) => void;
  loadingMembers: boolean;
  organizationData: any;
}

export type BoardColumn = {
  name: string;
  description: string;
  id: string;
  order: number;
};

export interface AIComment {
  id: string;
  comment: string;
}

export interface AIGroup {
  Comments: AIComment[];
  'Group Title': string;
  Tags: string[];
}

export interface GroupingData {
  Title: string;
  Groups: AIGroup[];
}
