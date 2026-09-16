import { Retrospectives } from '~/lib/retrospectives/types/retrospectives';
import { Rules } from '~/lib/rules/types';
import { TeamMembers } from '~/lib/teams/types/teams';

export interface Actions {
  id: string;
  description: string;
  assignee: string;
  date: any;
  organization: string;
  status: string;
  archive: boolean;
  order: number;
  team: string;
}

export interface ActionReference {
  id: string;
}

export interface ActionCardProps {
  action: Task;
  organizationId: string;
  teamId: string;
  deleteTask: (id: Id) => void;
  updateTask: (id: string, content: Task) => void;
  archiveTask: (id: string, archive: boolean) => void;
  teamMembers: any[] | TeamMembers[] | null;
  index: any;
  editCard: any;
  setEditCard: (card: any) => void;
  refetchTeamMembers: (name: string) => void;
  loadingMembers: boolean;
  organizationData: any;
  boardId?:string
}

export interface AddActionCardProps {
  teamId: any;
  teamMembers: any[] | TeamMembers[] | null;
  column: any;
  organizationId: string;
  createTask: (content: Task) => void;
  setShowCard: (card: any) => void;
  textAreaRef: any;
  refetchTeamMembers: (searchableText: string) => void;
  loadingMembers: boolean;
}

export interface ActionsPopoverProps {
  tasks: Task[];
  closeModalHandler: () => void;
  archiveTask: (id: string, archive: boolean) => void;
  organizationId: string;
  teamId: string;
  deleteTask: (id: Id) => void;
  updateTask: (id: string, content: Task) => void;
  columnFilter: any;
  teamMembers: any[] | TeamMembers[] | null;
  editCard: any;
  setEditCard: (card: any) => void;
  refetchTeamMembers: (searchableText: string) => void;
  loadingMembers: boolean;
  organizationData: any;
  boardId?:string;
}

export interface ActionSidebarComponentProps {
  setShowAddActionBar: (show: boolean) => void;
  organizationId: string;
  teamId: string;
  refetch: (selectedMember: string, selectedDate: string) => void;
  teamMembers: TeamMembers[] | any[] | null;
  refetchTeamMembers: (name: string) => void;
  loadingMembers: boolean;
  retrospectiveId: any;
  facilitator: string;
  createAction: (action: Task) => void;
  showOrgActions: boolean;
}

export interface ArchivedSidebarComponentProps {
  setShowArchivedActionBar: (show: boolean) => void;
  data: any;
  organizationId: string;
  teamId: string;
  updateTask: (id: string, content: Task) => void;
  deleteTask: (id: string) => void;
  archiveTask: (id: string, archive: boolean) => void;
  deleteActions: (id: string) => void;
  teamMembers: TeamMembers[] | any[] | null;
  refetchTeamMembers: (name: string) => void;
  loadingMembers: boolean;
  showOrgActions: boolean;
  currentUser: any;
  retrospectiveId: any;
  retrospective: Retrospectives;
  currentUserRole: number;
  rules: Rules
}

export interface UpdateSidebarComponentProps {
  setShowSidebar: (show: boolean) => void;
  action: Task | any;
  organizationId: string;
  teamId: string;
  refetch: (page: number) => void;
  teamMembers: TeamMembers[] | any[] | null;
  refetchTeamMembers: (name: string) => void;
  loadingMembers: boolean;
  selectedTab: number;
  retrospectiveId: string;
}
export interface HeaderProps {
  setShowAddActionBar: (show: boolean) => void;
  setShowArchivedActionBar: (show: boolean) => void;
  setFilterMember: (member: string) => void;
  teamId: string;
  showOrgActions: boolean;
  setShowOrgActions: (show: boolean) => void;
  isAllowedToCreate: boolean;
}
export interface ContentProps {
  organizationId: string;
  teamId: string;
  tasks: Task[];
  data: any;
  refetch: (selectedMember: string, selectedDate: string) => void;
  setTasks: (Task: Task[]) => void;
  setTasksFilter: (Task: Task[]) => void;
  createTask: (content: Task) => void;
  updateTask: (id: string, content: Task) => void;
  deleteTask: (id: string) => void;
  archiveTask: (id: string, archive: boolean) => void;
  setFilterMember: (member: string) => void;
  selectedMember: any;
  setFilterDate: (date: string) => void;
  filterDate: string;
  teamMembers: TeamMembers[] | any[] | null;
  searchMembers: (name: string) => void;
  boardMembers: any[];
  loading?: boolean;
  refetchTeamMembers: (searchableText: string) => void;
  loadingMembers: boolean;
  userId: string;
  showOrgActions: boolean;
  organizationData: any;
  currentUser: any;
  setSelectedBoard: (board: any) => void;
  selectedBoard: any;
  createAction: (task: Task) => void;
  updateAction: (id: string, task: Task) => void;
  deleteAction: (id: Id) => void;
  archiveAction: (id: string, archive: boolean) => void;
  actions: Task[];
  loadingBoardMembers: boolean;
  setIsAllowedToCreate: (isAllowed: boolean) => void;
}

export interface BoardActionsProps {
  organizationId: string;
  teamId: string;
  refetch: (selectedMember: string, selectedDate: string) => void;
  actions: Task[];
  setTasks: (content: any) => void;
  createTask: (task: Task) => void;
  deleteTask: (id: Id | any) => void;
  updateTask: (id: string, content: Task) => void;
  archiveTask: (id: string, archive: boolean) => void;
  setTasksFilter: (content: any) => void;
  teamMembers: TeamMembers[] | any[] | null;
  refetchTeamMembers: (searchableText: string) => void;
  loadingMembers: boolean;
  organizationData: any;
  boardId?:string;
}

export interface ColumnContainerProps {
  column: Column;
  createTask: (task: Task) => void;
  updateTask: (id: string, content: Task) => void;
  deleteTask: (id: Id) => void;
  archiveTask: (id: string, archive: boolean) => void;
  refetch: (selectedMember: string, selectedDate: string) => void;
  organizationId: string;
  teamId: string;
  tasks: Task[];
  teamMembers: TeamMembers[] | any[] | null;
  showCard: any;
  setShowCard: (show: any) => void;
  editCard: any;
  setEditCard: (card: any) => void;
  refetchTeamMembers: (searchableText: string) => void;
  loading: boolean;
  organizationData: any;
  boardId?:string;
}

export interface UpdateTaskItem {
  action: Task | any;
  organizationId: string;
  teamId: string;
  refetch: (page: number) => void;
  setShowSidebar: (show: boolean) => void;
  teamMembers: TeamMembers[] | any[] | null | any;
  refetchTeamMembers: (searchableText: string) => void;
  loading: boolean;
  selectedTab: number;
  retrospectiveId: string;
}
export interface TaskItem {
  action: Task;
  organizationId: string;
  teamId: string;
  updateTask: (id: string, content: Task) => void;
  deleteTask: (id: string) => void;
  archiveTask: (id: string, archive: boolean) => void;
  deleteActions: (id: string) => void;
  teamMembers: TeamMembers[] | any[] | null | any;
  editCard: string;
  setEditCard: (card: string) => void;
  refetchTeamMembers: (searchableText: string) => void;
  loading: boolean;
  showOrgActions: boolean;
  retrospectiveId: string;
  facilitator: string;
  rules: Rules;
  retrospective: Retrospectives;
  currentUserRole: number;
}
export type Status = 'To do' | 'In Progress' | 'Done';

export type Task = {
  title: string;
  date: any;
  userName: string;
  description: string;
  status: Status;
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
  jiraURl?: string;
};

export type BoardSections = {
  [name: string]: Task[];
};

export type Id = string | number;

export type Column = {
  id: Id;
  title: string;
};
