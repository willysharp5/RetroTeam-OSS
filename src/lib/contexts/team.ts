import { createContext } from 'react';
import { Teams } from '../teams/types/teams';

export const TeamContext = createContext<{
  team: Maybe<WithId<Teams>> | Teams;
  setTeam: (user: any) => void;
}>({
  team: undefined,
  setTeam: (_) => _,
});
