import { MembershipRole } from '~/lib/organizations/types/membership-role';

export interface MembershipInvite {
  email: string;
  role: MembershipRole;
  code: string;
  expiresAt: number;
  created: any;
  organization: {
    id: string;
    name: string;
  };
}

export interface BoardMembershipInvite {
  email: string;
  role: MembershipRole;
  code: string;
  expiresAt: number;
  facilitator: string;
  created: any;
  organization: {
    id: string;
    name: string;
  };
  retrospective: {
    id: string;
    name: string;
    type: string;
  };
  teamId: string;
  type: string;
  accepted?: boolean;
}

export interface RequestsBoard {
  id: string;
  organization: string;
  status: string;
  userId: string;
  userRef: any;
  userName: string;
  email: string;
}
