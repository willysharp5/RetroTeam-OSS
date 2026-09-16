import { MembershipRole } from './membership-role';

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
  team: {
    id: string;
  }
  type: string;
}

export interface TeamMembershipInvite {
  email: string;
  role?: MembershipRole;
  code: string;
  expiresAt: number;
  created: any;
  organization: {
    id: string;
    name: string;
  };
  team: {
    id: string;
    name: string;
  };
  type: string;
  facilitator: string;
  accepted?: boolean;
  id?: string;
}
