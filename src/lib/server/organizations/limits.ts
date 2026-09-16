import { FieldValue } from 'firebase-admin/firestore';

import { getOrganizationsCollection } from '~/lib/server/collections';

interface AddLimitsProps {
  organizationId: string;
  limit: any;
}

/**
 * @name setOrganizationLimitsuseFirestore
 * @description Sets the limits for an organization
 */
export function setOrganizationLimits(props: AddLimitsProps) {
  const { organizationId, limit } = props;
  const organization = getOrganizationsCollection().doc(organizationId);

  return organization.update({
    [`limits.${limit.key}`]: FieldValue.increment(limit.quantity),
  });
}
