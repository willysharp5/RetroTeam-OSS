import LoadingMembersSpinner from '~/components/organizations/LoadingMembersSpinner';

import SearchableDropdown from '../actions/searchableMembersDropdown';
import useSearchTeamMembersRole from '~/lib/server/teams/search-team-members-role';
import { useEffect, useState } from 'react';

const TeamMembersSelector: React.FCC<{
  organizationId: string;
  selectedMember: any;
  teamId: string;
  type: number;
  setFilterMember: (member: any) => void;
  refetchTrigger: number;
  resetInput: boolean;
}> = ({
  organizationId,
  setFilterMember,
  selectedMember,
  teamId,
  type,
  refetchTrigger,
  resetInput,
}) => {
  const { data, refetch, loading, error } = useSearchTeamMembersRole(
    organizationId,
    teamId,
    '',
    type,
  );

  useEffect(() => {
    refetch('', type);
  }, [refetchTrigger]);

  const isLoading = loading;

  if (isLoading) {
    return <LoadingMembersSpinner></LoadingMembersSpinner>;
  }

  return (
    <>
      <SearchableDropdown
        refetch={refetch}
        type={type}
        options={data}
        label="name"
        handleChange={setFilterMember}
        selectedVal={selectedMember}
        hasAllMembers={false}
        resetInput={resetInput}
      />
    </>
  );
};

export default TeamMembersSelector;
