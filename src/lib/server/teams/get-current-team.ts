import { getOrganizationById, getTeamById } from '../queries';
import { Organization } from '~/lib/organizations/types/organization';
import {
  getOrganizationsCollection,
  getTeamCollection,
  getTeamMembersCollection,
} from '~/lib/server/collections';

/**
 * @name getCurrentTeam
 * @description Fetch the selected team (or the first one in the list)
 */
export async function getCurrentTeam(
  userId: string,
  organizationId: Maybe<string> = undefined,
  teamId: Maybe<string> = undefined,
) {
  return getTeamByIdOrFirst(organizationId, userId, teamId);
}

/**
 * @name isUsableId
 * @description Whether a value read out of a cookie can be used as a Firestore
 * document id.
 *
 * Cookies only hold strings, so `undefined` and `null` arrive as their literal
 * text, and clearing one can leave an empty string behind. Passing any of those
 * to `doc()` throws rather than returning nothing, and the callers of
 * `getCurrentTeam` treat a thrown error as a failed session — so a single junk
 * cookie value signed the user out on every page load.
 */
function isUsableId(value: Maybe<string>) {
  if (!value) {
    return false;
  }

  const trimmed = value.trim();

  return trimmed !== '' && trimmed !== 'undefined' && trimmed !== 'null';
}

/**
 * @name getTeamByIdOrFirst
 * @description Resolve the team for {@link userId}, preferring the one named by
 * the `teamId` cookie.
 *
 * In order:
 *
 * 1. The cookie's team, if the id is usable, the team still exists, and the user
 *    is a member of the organization.
 * 2. The first team in that organization the user is an active member of. The
 *    caller re-saves the cookie afterwards, so a stale, empty or dangling one
 *    heals itself on the next request rather than persisting.
 * 3. The first team found anywhere for the user, when no organization was given
 *    or they turn out not to belong to it.
 *
 * Every step swallows its own failures, because there is no team a broken
 * request could resolve to and the alternative — letting it throw — is what
 * logged people out.
 */
async function getTeamByIdOrFirst(
  organizationId: Maybe<string>,
  userId: string,
  teamId: Maybe<string>,
) {
  if (!isUsableId(organizationId)) {
    return getFirstTeam(userId);
  }

  const organizationID = organizationId as string;

  const organization = await getOrganizationData(organizationID).catch(
    () => undefined,
  );

  // check the user ID belongs to the organization members
  const userBelongsToOrganization = userId in (organization?.members ?? {});

  // if the user doesn't have permissions to access
  // the organization, we simply return the first one
  if (!userBelongsToOrganization) {
    return getFirstTeam(userId);
  }

  if (isUsableId(teamId)) {
    const team = await getTeamData(organizationID, (teamId as string).trim())
      // the cookie can outlive the team it names: delete a team, or restore the
      // project from a backup, and the id points at nothing
      .catch(() => undefined);

    if (team) {
      return team;
    }
  }

  return getFirstTeamOfOrganization(organizationID, userId);
}

/**
 * @name getFirstTeam
 * @description Get the first organization team in the user's record
 */
async function getFirstTeam(userId: string) {
  try {
    const organizations = await getOrganizationsByUserId(userId).limit(1).get();
    const doc = organizations.docs[0];

    const teamsQuerySnapshot = await getTeamsByUserId(doc.id)
      .orderBy('createdAt', 'desc')
      .get();

    let userTeams = [];
    for (const teamDoc of teamsQuerySnapshot.docs) {
      const teamId = teamDoc.id;

      const usersCollectionRef = await getTeamMembersCollection(doc.id, teamId)
        .where('userId', '==', userId)
        .where('active', '==', true)
        .get();

      if (usersCollectionRef.size > 0) {
        userTeams.push(teamDoc.data());
      }
    }

    return userTeams[0];
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function getFirstTeamOfOrganization(
  organizationId: string,
  userId: string,
) {
  try {
    const teamsQuerySnapshot = await getTeamsByUserId(organizationId)
      .orderBy('createdAt', 'desc')
      .get();
    let userTeams = [];
    for (const teamDoc of teamsQuerySnapshot.docs) {
      const teamId = teamDoc.id;

      const usersCollectionRef = await getTeamMembersCollection(
        organizationId,
        teamId,
      )
        .where('userId', '==', userId)
        .where('active', '==', true)
        .get();

      if (usersCollectionRef.size > 0) {
        userTeams.push(teamDoc.data());
      }
    }
    if (userTeams) return userTeams[0];
    else return null;
  } catch (e) {
    console.error(e);
    return null;
  }
}

/**
 * @name getOrganizationData
 * @param organizationId
 */
async function getOrganizationData(organizationId: string) {
  const organization = await getOrganizationById(organizationId);
  const data = organization.data();

  return data ? serializeOrganizationData(data, organizationId) : undefined;
}

async function getTeamData(organizationId: string, teamId: string) {
  const team = await getTeamById(organizationId, teamId);
  const data = team.data();

  return data;
}

function serializeOrganizationData(organization: Organization, id: string) {
  const members = Object.keys(organization.members).reduce((acc, userId) => {
    const member = organization.members[userId];

    const item = {
      role: member.role,
      user: member.user.id,
    };

    return {
      ...acc,
      [userId]: item,
    };
  }, {});

  return {
    ...organization,
    members,
    id,
  };
}

/**
 * @name getOrganizationsByUserId
 * @description Get all the organizations where the user {@link userId} is a member
 * @param userId
 */
function getOrganizationsByUserId(userId: string) {
  if (userId == null || userId === '') {
    throw new Error('userId is required for getOrganizationsByUserId');
  }
  const organizations = getOrganizationsCollection();
  const path = `members.${userId}`;

  return organizations.where(path, '!=', null);
}

/**
 * @name getTeamsByUserId
 * @description Get all the teams where the user {@link userId} is a member
 * @param userId
 */
function getTeamsByUserId(organizationId: string) {
  const teams = getTeamCollection(organizationId);

  return teams;
}
