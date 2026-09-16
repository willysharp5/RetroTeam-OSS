/**
 * @name useIsSubscriptionActive
 * @description Returns whether the organization may use paid-tier features.
 *
 * RetroTeam OSS has no paid tier and no billing: every feature is available to
 * every organization, so this is always `true`. It is kept as a hook (rather
 * than removed) so the components that guard optional UI on it keep reading
 * from a single, obvious place.
 */
function useIsSubscriptionActive() {
  return true;
}

export default useIsSubscriptionActive;
