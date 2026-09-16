/**
 * Entitlements — RetroTeam OSS
 *
 * This open-source build has no paid tier and no billing. Every feature is
 * available to every organization, so all of the limits below are `Infinity`.
 *
 * The shape is kept because a number of components read these fields when
 * rendering counters and lists. Treat it as "how much of X may this
 * organization use", where `Infinity` means "as much as it likes".
 */

export interface Restrictions {
  maxTeams?: number;
  maxActionItemsPerBoard?: number;
  maxAIPrompts?: number;
  maxGeneralActionItems?: number;
  maxRetrospectives?: number;
  maxInvites?: number;
}

/**
 * @name UNLIMITED_RESTRICTIONS
 * @description The single source of truth for entitlements in the OSS build.
 * Every limit is unlimited. Arithmetic such as `limit + purchasedExtra` and
 * comparisons such as `used >= limit` therefore always resolve in the user's
 * favour, which is why no upgrade prompt can ever be triggered.
 */
export const UNLIMITED_RESTRICTIONS: Required<Restrictions> = {
  maxTeams: Infinity,
  maxActionItemsPerBoard: Infinity,
  maxAIPrompts: Infinity,
  maxGeneralActionItems: Infinity,
  maxRetrospectives: Infinity,
  maxInvites: Infinity,
};
