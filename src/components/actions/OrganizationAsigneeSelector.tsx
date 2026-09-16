import { Trans } from 'next-i18next';
import Image from 'next/image';

import { useFetchOrganization } from '~/lib/organizations/hooks/use-fetch-organization';
import { useFetchOrganizationMembersMetadata } from '~/lib/organizations/hooks/use-fetch-members-metadata';
import { Organization } from '~/lib/organizations/types/organization';

import { useUserId } from '~/core/hooks/use-user-id';
import Alert from '~/core/ui/Alert';

import LoadingMembersSpinner from '~/components/organizations/LoadingMembersSpinner';

import plus from '../../../public/assets/svg/plus.svg';

import ProfileAvatar from '../ProfileAvatar';

import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '~/core/ui/SelectAsignees';
import { SelectIcon } from '@radix-ui/react-select';

const OrganizationMembersSelector: React.FCC<{
  organizationId: string;
  setSelectedMember: (asignee: string) => void;
  selectedMember: string;
}> = ({ organizationId, selectedMember, setSelectedMember }) => {
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
          setSelectedMember(value);
        }}
      >
        <SelectTrigger data-cy={'role-selector-trigger'}>
          <SelectValue />
          {selectedMember === '' && (
            <SelectIcon>
              <button className="flex items-center">
                <div className="bg-black rounded-full p-1 h-6 w-6">
                  <Image src={plus} alt="plus" />
                </div>
                <p className="ml-2 text-[#71717A] text-sm">Assignee</p>
              </button>
            </SelectIcon>
          )}
        </SelectTrigger>

        <SelectContent>
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
