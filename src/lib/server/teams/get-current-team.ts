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
 * @name getTeamByIdOrFirst
 * @description Given a user ID {@link userId}, this function will return
 * either:
 *
 * 1. The organizationId passed as first parameter, if passed
 * 2. Or, in case of errors, the first organization found the user belongs to as
 * fallback
 *
 * @param organizationId
 * @param userId
 */
async function getTeamByIdOrFirst(
  organizationId: Maybe<string>,
  userId: string,
  teamId: Maybe<string>,
) {
  const organizationID = organizationId as string;
  // if the organization ID was passed from the cookie, we try read that
  if (organizationId && teamId !== 'undefined' && teamId != undefined) {
    const organization = await getOrganizationData(organizationId);
    const teamID = teamId as string;
    const team = await getTeamData(organizationId, teamID);

    // check the user ID belongs to the organization members
    const userBelongsToOrganization = userId in (organization?.members ?? {});

    // if the user doesn't have permissions to access
    // the organization, we simply return the first one
    if (userBelongsToOrganization) {
      return team;
    }
  } else if (
    (organizationId && teamId === 'undefined') ||
    (organizationId && teamId === undefined)
  ) {
    const team = await getFirstTeamOfOrganization(organizationID, userId);

    return team;
  }

  // if the organization ID was not passed
  // or if somehow the user lacked the permissions
  // we simply return the first organization they belong to
  return getFirstTeam(userId);
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
