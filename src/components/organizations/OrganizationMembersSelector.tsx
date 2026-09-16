import { Trans } from 'next-i18next';

import { useFetchOrganization } from '~/lib/organizations/hooks/use-fetch-organization';
import { useFetchOrganizationMembersMetadata } from '~/lib/organizations/hooks/use-fetch-members-metadata';
import { Organization } from '~/lib/organizations/types/organization';

import { useUserId } from '~/core/hooks/use-user-id';
import LoadingMembersSpinner from '~/components/organizations/LoadingMembersSpinner';

import ProfileAvatar from '../ProfileAvatar';
import Alert from '~/core/ui/Alert';

import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '~/core/ui/Select';

const OrganizationMembersSelector: React.FCC<{
  organizationId: string;
  selectedMember: string;
  setFilterMember: (member: string) => void;
}> = ({ organizationId, setFilterMember, selectedMember }) => {
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

  if (error) {
    return (
      <Alert type={'error'}>
        <Trans i18nKey={'organization:loadMembersError'} />
      </Alert>
    );
  }

  const members = getSortedMembers(organization);
  const currentUser = members.find((member) => member.id === userId);

  if (!currentUser) {
    return null;
  }

  const userRole = currentUser.role;

  return (
    <>
      <Select
        value={selectedMember}
        onValueChange={(value) => {
          setFilterMember(value);
        }}
      >
        <SelectTrigger data-cy={'role-selector-trigger'}>
          <SelectValue />
        </SelectTrigger>

        <SelectContent>
          <SelectItem
            key={'defualt'}
            data-cy={'organization-member'}
            value={'Any member'}
          >
            <p>Any member</p>
          </SelectItem>
          {members.map(({ id: memberId }) => {
            const metadata = membersMetadata?.find((metadata) => {
              return metadata.uid === memberId;
            }) as any;

            if (!metadata) {
              return null;
            }

            const displayName = metadata.name
              ? metadata.name + ' ' + metadata.lastName
              : metadata.email ?? metadata.phoneNumber ?? 'Anonymous';

            const key = `${metadata.uid}:${userRole}`;

            return (
              <SelectItem
                key={key}
                data-cy={'organization-member'}
                value={memberId}
              >
                <div className="flex flex-auto items-center space-x-2">
                  <ProfileAvatar user={metadata} />

                  <div className={'block truncate text-sm'}>{displayName}</div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </>
  );
};

export default OrganizationMembersSelector;

/**
 * @description Return the list selector of members sorted by role {@link MembershipRole}
 * @param organization
 */
function getSortedMembers(organization: WithId<Organization>) {
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
