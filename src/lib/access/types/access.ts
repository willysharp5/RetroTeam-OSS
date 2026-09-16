export interface Access {
  type: 'public' | 'private' | 'team';
  details?: {
    userIds?: string[];
    teamId?: string;
  };
}
