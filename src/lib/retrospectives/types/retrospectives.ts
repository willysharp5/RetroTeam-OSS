import { Access } from '~/lib/access/types/access';
import { Structure } from '~/lib/structures/types/structures';
import { ActionReference } from '~/lib/actions/types/actions';
import { Teams } from '~/lib/teams/types/teams';

interface MemberList {
  active: boolean;
  captureDone: boolean;
  created: Date;
  role: number;
  user: any;
  voteDone: boolean;
}

export interface Retrospectives {
  access: Access;
  aiGrouped?: boolean;
  locked?: boolean;
  date: any;
  finished: boolean;
  icebreaker: boolean;
  icebreaker_info: {
    category: string;
    question: string;
  };
  id: string;
  members: MemberList[];
  name: string;
  organization: string;
  structure: Structure[];
  title: string;
  teamId?: string;
  relatedActions?: ActionReference[];
  authors?: boolean;
  votes?: number;
  archived: boolean;
  createdBy?: string;
  groupWithAI?: boolean;
  actionsWithAI?: boolean;
  teamData: Teams;
  aiActions?: any[];
  href?: string;
  selectedColumns?:Structure[]
  loadingAIGrouping?: boolean;
}

export interface AddRetrospectives {
  title: string;
  name: string;
  access: Access;
  date: any;
  icebreaker: boolean;
  structure: Structure[];
  organization: string;
  team?: any;
  locked?: boolean;
  members?: any;
  authors?: boolean;
  archived?: boolean;
  createdBy: string;
  finished?: boolean;
  searchableName?: string;
  allowMembersViewComments: boolean;
  groupWithAI?: boolean;
  actionsWithAI?: boolean;

}
