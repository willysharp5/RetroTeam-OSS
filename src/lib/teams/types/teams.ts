import { Organization } from '~/lib/organizations/types/organization';

export interface Teams {
  id: string;
  name: string;
  owner: string;
  user: TeamMembers;
  users: TeamMembers[];
  members: number;
  admins: number;
  owners: number;
  createdAt: Date;
}

export interface TeamMembers {
  email: string;
  name: string;
  lastName: string;
  fullName: string;
  role: number;
  userId: string;
  length: number;
  active: boolean;
}

export interface DeleteModalProps {
  closeModalHandler: () => void;
  team: Teams | any;
  organizationId: string | undefined;
}

export interface TeamsListProps {
  createTeamHandler: () => void;
  data: Teams[] | null;
  setUpdateTeams: (update: boolean) => void;
  setSelectedTeam: (team: Teams | any) => void;
  organizationId: string | undefined;
  refetch: (page: number) => void;
  totalTeams: number;
  totalPages: number;
  loading: boolean;
  currentPage: number;
  rowsPerPage: number;
  setRowsPerPage: (page: number) => void;
  sortData: (page: number, type: string, lastId: string) => void;
  search: (page: number, text: string) => void;
  teamFilter: string;
  setTeamFilter: (text: string) => void;
  sorted: string;
  setSorted: (sort: string) => void;
  showModalHandler: () => void;
  deleteModal: boolean;
  isAnonymous: boolean;
}

export interface Content {
  team: Teams;
  organizationId: string | undefined;
  setUpdateTeams: (update: boolean) => void;
}

export interface MembersListProps {
  teams: Teams | any;
  members: TeamMembers[] | null[] | never[];
  setUpdateMember: (update: boolean) => void;
  setSelectedMember: (team: Teams | any) => void;
  setMemberFilter: (members: TeamMembers | any) => void;
  loading: boolean;
  organizationId: string;
  userId: string;
  refetch: (limitNumber: number) => void;
  sortData: (page: number, type: string) => void;
  organizationName: string;
  currentUserRole: number;
  currentPage: number;
  totalPages: number;
  rowsPerPage: number;
  setRowsPerPage: (page: number) => void;
  memberFilter: string;
  search: (page: number, searchableText: string) => void;
  isAnonymous: boolean;
  setAnonymousModal: (show: boolean) => void;
  totalOrganizationTeams: number;
  totalMembers: number;
}

export interface UpdateMemberScreenProps {
  organization: Organization | any;
  team: Teams | any;
  member: TeamMembers | any;
  userId: string;
}

export interface AddTeamScreenProps {
  setAddTeams: (update: boolean) => void;
  organizationId: string;
}

export interface InvitesListProps {
  teams: Teams | any;
  organizationId: string;
  isAnonymous: boolean;
  setAnonymousModal: (show: boolean) => void;
}

export interface UpdateTeamScreenProps {
  setUpdateTeams: (update: boolean) => void;
  showModalHandler: () => void;
  organizationId: string;
  team: Teams | any;
  organizationName: string;
  totalTeams: number;
}
