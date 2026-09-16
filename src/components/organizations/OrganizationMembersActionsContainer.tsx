import { useState } from 'react';
import type { User } from 'firebase/auth';

import { MembershipRole } from '~/lib/organizations/types/membership-role';
import TransferOrganizationOwnershipModal from '~/components/organizations/TransferOrganizationOwnershipModal';

import OrganizationMemberActionsDropdown from './OrganizationMemberActionsDropdown';
import RemoveOrganizationMemberModal from './RemoveOrganizationMemberModal';
import UpdateMemberRoleModal from './UpdateMemberRoleModal';
import If from '~/core/ui/If';

const OrganizationMembersActionsContainer: React.FCC<{
  targetMember: User;
  targetMemberRole: MembershipRole;
  currentUserRole: MembershipRole;
  disabled: boolean;
  refetch: () => void;
}> = (props) => {
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [isRemovingUser, setIsRemovingUser] = useState(false);
  const [isTransferringOwnership, setIsTransferringOwnership] = useState(false);

  const isOwner = props.currentUserRole === MembershipRole.Admin;
  return (
    <>
      <OrganizationMemberActionsDropdown
        disabled={props.disabled}
        isOwner={isOwner}
        onRemoveSelected={() => setIsRemovingUser(true)}
        onChangeRoleSelected={() => setIsUpdatingRole(true)}
        onTransferOwnershipSelected={() => setIsTransferringOwnership(true)}
        canTransferRole={isOwner && props.targetMemberRole > 0}
      />

      <RemoveOrganizationMemberModal
        setIsOpen={setIsRemovingUser}
        isOpen={isRemovingUser}
        member={props.targetMember}
        refetch={props.refetch}
      />

      <UpdateMemberRoleModal
        setIsOpen={setIsUpdatingRole}
        isOpen={isUpdatingRole}
        member={props.targetMember}
        memberRole={props.targetMemberRole}
        refetch={props.refetch}
      />

      <If condition={isOwner && props.targetMemberRole > 0}>
        <TransferOrganizationOwnershipModal
          setIsOpen={setIsTransferringOwnership}
          isOpen={isTransferringOwnership}
          member={props.targetMember}
        />
      </If>
    </>
  );
};

export default OrganizationMembersActionsContainer;
