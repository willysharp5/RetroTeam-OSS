import roles from '~/lib/organizations/roles';
import { MembershipRole } from '~/lib/organizations/types/membership-role';

export function getSelectedRoleModel(currentRole: MembershipRole | undefined) {
  const role = roles.find((role) => {
    return role.value === currentRole;
  });

  return role?.label;
}
