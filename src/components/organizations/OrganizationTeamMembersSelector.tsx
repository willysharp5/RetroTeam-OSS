import { useEffect, useState, useMemo } from 'react';
import { Trans } from 'next-i18next';

import { useFetchOrganization } from '~/lib/organizations/hooks/use-fetch-organization';
import { Organization } from '~/lib/organizations/types/organization';

import { useUserId } from '~/core/hooks/use-user-id';
import LoadingMembersSpinner from '~/components/organizations/LoadingMembersSpinner';

import Alert from '~/core/ui/Alert';

import { useFetchOrganizationTeamMembersMetadata } from '~/lib/organizations/hooks/use-fetch-team-members-metadata';
import SearchableDropdown from '../actions/searchableMembersDropdown';

const OrganizationTeamMembersSelector: React.FC<{
  organizationId: string;
  teamId: string;
  selectedMember: string;
  setFilterMember: (member: string) => void;
  showOrgActions: boolean;
  selectedBoard?: any;
  searchBoardMembers?: (member: string) => void;
  boardMetadataMembers?: any;
}> = ({
  organizationId,
  setFilterMember,
  selectedMember,
  teamId,
  showOrgActions = true,
  selectedBoard,
  searchBoardMembers,
  boardMetadataMembers,
}) => {
  const userId = useUserId();

  const [data, setData] = useState<any[]>([]);
  const [options, setOptions] = useState<any[]>([]);
  const [boardMembers, setBoardMembers] = useState<any>([]);

  const { data: organization, status } = useFetchOrganization(organizationId);

  const {
    data: info,
    loading,
    error,
    searchMembers,
    loadingSearch,
  } = useFetchOrganizationTeamMembersMetadata(organizationId, teamId, 10);
  const [membersMetadata, setMembersMetaData] = useState<any>(info);

  const isLoading = status === 'loading' || loading;

  const members = useMemo(() => getSortedMembers(organization), [organization]);
  const currentUser = useMemo(
    () => members?.find((member) => member.id === userId),
    [members, userId],
  );

  useEffect(() => {
    setMembersMetaData(info);
  }, [info]);

  useEffect(() => {
    if (members && members.length > 0 && membersMetadata?.length > 0) {
      const membersInfo = members
        .map(({ id: memberId }) => {
          const metadata = membersMetadata.find(
            (metadata: any) => metadata.uid === memberId,
          );

          if (!metadata) {
            return null;
          }

          const displayName = metadata.name
            ? `${metadata.name} ${metadata.lastName}`
            : metadata.email ?? metadata.phoneNumber ?? 'Anonymous';

          return {
            metadata,
            displayName,
            key: `${metadata.uid}:${currentUser?.role}`,
            id: memberId,
          };
        })
        .filter(Boolean);

      setData(membersInfo);
    }
  }, [members, membersMetadata, currentUser]);

  useEffect(() => {
    if (showOrgActions && data.length > 0) {
      setOptions(data);
    } else if (!showOrgActions && boardMembers.length > 0) {
      setOptions(boardMembers);
    }
  }, [showOrgActions, data, boardMembers]);

  useEffect(() => {
    if (selectedBoard && boardMetadataMembers.length > 0) {
      const simplifyData = (data: any) => {
        return Object.keys(data).map((key) => ({
          userId: data[key].userId,
          role: data[key].role,
          active: data[key].active,
          status: data[key].status,
          created: data[key].created,
        }));
      };

      const members = simplifyData(selectedBoard.members);
      const membersInfo = members
        .map(({ userId: memberId }) => {
          const metadata = boardMetadataMembers.find(
            (metadata: any) => metadata.userId === memberId,
          );

          if (!metadata) {
            return null;
          }

          const displayName = metadata.name
            ? `${metadata.name} ${metadata.lastName}`
            : metadata.email ?? metadata.phoneNumber ?? 'Anonymous';

          return {
            metadata,
            displayName,
            key: `${metadata.uid}:${currentUser?.role}`,
            id: memberId,
          };
        })
        .filter(Boolean);

      setBoardMembers(membersInfo);
    }
  }, [selectedBoard, boardMetadataMembers]);

  if (isLoading) {
    return <LoadingMembersSpinner />;
  }

  if (error) {
    return (
      <Alert type={'error'}>
        <Trans i18nKey={'organization:loadMembersError'} />
      </Alert>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <>
      {options?.length > 0 && (
        <SearchableDropdown
          refetch={showOrgActions ? searchMembers : searchBoardMembers}
          loading={loadingSearch}
          options={options}
          label="displayName"
          handleChange={setFilterMember}
          selectedVal={selectedMember}
        />
      )}
    </>
  );
};

export default OrganizationTeamMembersSelector;

/**
 * @description Return the list selector of members sorted by role {@link MembershipRole}
 * @param organization
 */
function getSortedMembers(organization: WithId<Organization>) {
  if (organization) {
    const membersIds = Object.keys(organization.members ?? {});

    return membersIds
      .map((memberId) => {
        const member = organization.members[memberId];

        return {
          ...member,
          id: memberId,
        };
      })
      .sort((prev, next) => {
        return next.role > prev.role ? 1 : -1;
      });
  }
}
