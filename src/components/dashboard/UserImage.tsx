import { Trans } from 'next-i18next';
import Image from 'next/image';

import { useFetchOrganization } from '~/lib/organizations/hooks/use-fetch-organization';
import { useFetchOrganizationMembersMetadata } from '~/lib/organizations/hooks/use-fetch-members-metadata';
import { Organization } from '~/lib/organizations/types/organization';

import { useUserId } from '~/core/hooks/use-user-id';

import LoadingMembersSpinner from '~/components/organizations/LoadingMembersSpinner';

import ProfileAvatar from '../ProfileAvatar';

const UserImage: React.FCC<{
  organizationId: string;
  selectedMember: string;
}> = ({ organizationId, selectedMember }) => {
  const userId = useUserId();

  const { data: organization, status } = useFetchOrganization(organizationId);

  const {
    data: membersMetadata,
    isLoading: loading,
    error,
  } = useFetchOrganizationMembersMetadata(organizationId);

  const isLoading = status === 'loading' || loading;

  if (isLoading) {
    return <LoadingMembersSpinner></LoadingMembersSpinner>;
  }

  /*if (error) {
    return (
      <Alert type={'error'}>
        <Trans i18nKey={'organization:loadMembersError'} />
      </Alert>
    );
  }*/

  const members = getSortedMembers(organization, selectedMember);
  const metadata = membersMetadata?.find((metadata) => {
    return metadata.uid === members?.id;
  }) as any;

  if (!metadata) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 font-semibold uppercase text-white"></div>
    );
  }
  return <ProfileAvatar user={metadata} />;
};

export default UserImage;

/**
 * @description Return the list selector of members sorted by role {@link MembershipRole}
 * @param organization
 */ function getSortedMembers(
  organization: WithId<Organization>,
  selectedMemberId: string,
) {
  const selectedMember = organization?.members[selectedMemberId];

  if (selectedMember) {
    return {
      ...selectedMember,
      id: selectedMemberId,
    };
  } else {
    return null; // Retorna null si no se encuentra el miembro con el ID deseado.
  }
}
