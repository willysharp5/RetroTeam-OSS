export type Notification = {
  title: string;
  subtitle: string;
  created: any;
  category: string;
  information: {
    organizationId: string;
    teamId: string;
    retrospectiveId: string;
    type?: string;
    facilitator?: string;
    retrospectiveName?: string;
    teamName?: string;
  };
  code?: string;
  email: string;
  type: string;
  id: string;
  accepted?: boolean;
  inviteData?: any;
  seen: boolean;
};
