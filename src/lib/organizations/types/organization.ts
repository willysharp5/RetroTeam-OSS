import { FirestoreOrganizationMembership } from './organization-membership';

type UserId = string;

interface BaseOrganization {
  name: string;
  timezone?: string;
  logoURL?: string | null;
  invites: number;
}

interface BaseOrganizationModal {
  name: string;
  timezone?: string;
  logoURL?: string | null;
}

export interface Limit {
  priceId: string;
  product: string;
  key: string;
  quantity: number;
}

export interface Organization extends BaseOrganization {
  members: Record<UserId, FirestoreOrganizationMembership>;
  aiCounter?: number;
  /**
   * Legacy field. RetroTeam OSS has no billing, so this is never written and
   * never read for gating — see `~/lib/entitlements`. It is kept only so
   * organizations created by an older, paid build still deserialize.
   */
  subscription?: any;
  createdAt?: any;
  teams?: number;
  searchableName?: string;
  updatedBy?: string;
  /**
   * Legacy per-organization limit overrides. Ignored in the OSS build, where
   * every limit is unlimited.
   */
  limits?: {
    maxAIPrompts?: number;
    maxInvites?: number;
    maxTeams?: number;
  };
  icebreaker_info?: {
    question: string,
    category: string
  }
  minute?: string,
  second?: string,
  play?: boolean,
  pause?: boolean,
  showTimerModal?: boolean,
  sound?: string
  /** Legacy field from the paid build. Unused in RetroTeam OSS. */
  customerId?: string;
  companyEmail?: string;
  embededLink?: string;
  jiraIntegration?: {
    connected?: boolean;
    clientId: string;
    clientSecret: string;
    domain?: string
    accessToken?: string
    email?: string;
    apiKey:string;
  }
}

export interface OrganizationModal extends BaseOrganizationModal {
  members: Record<UserId, FirestoreOrganizationMembership>;
  aiCounter?: number;
  invites?: number;
  subscription?: any;
  createdAt?: any;
  searchableName?: string;
}
