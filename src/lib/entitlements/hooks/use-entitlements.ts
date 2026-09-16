import {
  Restrictions,
  UNLIMITED_RESTRICTIONS,
} from '~/lib/entitlements/types';

/**
 * @name useEntitlements
 * @description Returns what the current organization is allowed to do.
 *
 * RetroTeam OSS has no paid tier: every organization is entitled to
 * everything, so this always resolves immediately to unlimited.
 */
export function useEntitlements() {
  return {
    restrictions: UNLIMITED_RESTRICTIONS as Restrictions,
    loading: false,
    error: null as Error | null,
  };
}

/**
 * @name useCurrentSubscriptionById
 * @description Backwards-compatible alias of {@link useEntitlements}, kept so
 * the many components that used to read a plan's restrictions keep working
 * without a paid tier. The arguments are ignored.
 *
 * Prefer `useEntitlements()` in new code.
 */
export function useCurrentSubscriptionById(
  _subscriptionId?: string,
  _subscriptionStatus?: string,
) {
  return {
    product: UNLIMITED_RESTRICTIONS as Restrictions,
    loading: false,
    error: null as Error | null,
  };
}
