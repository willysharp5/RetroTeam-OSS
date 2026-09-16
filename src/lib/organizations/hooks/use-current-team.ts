import { useContext } from 'react';
import { TeamContext } from '~/lib/contexts/team';

export function useCurrentTeam() {
  const { team, setTeam } = useContext(TeamContext);

  return { team, setTeam };
}
