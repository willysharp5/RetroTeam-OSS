import { FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { ApiError } from 'next/dist/server/api-utils';

import { HttpStatusCode } from '~/core/generic/http-status-code.enum';
import { MembershipRole } from '~/lib/organizations/types/membership-role';
import { Organization } from '~/lib/organizations/types/organization';

import {
  getOrganizationById,
  getOrganizationMemberById,
  getTeamMemberById,
  getUserData,
  getUserRefById,
} from '../queries';

import {
  ACCEPTED_INVITES_COLLECTION,
  ORGANIZATIONS_COLLECTION,
  TEAMS_COLLECTION,
  USERS_COLLECTION,
} from '~/lib/firestore-collections';

import {
  throwNotFoundException,
  throwUnauthorizedException,
} from '~/core/http-exceptions';

import {
  getAcceptedInvitesCollection,
  getInvitesCollection,
  getOrganizationsCollection,
  getTeamInvitesCollection,
} from '~/lib/server/collections';
import {
  MembershipInvite,
  TeamMembershipInvite,
} from '~/lib/organizations/types/membership-invite';
import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';
import configuration from '~/configuration';

import { sendEmail } from '~/lib/server/email/send-email';
/**
 * @name getOrganizationMembers
 * @description Returns the {@link UserInfo} object from the members of an organization
 */
export async function getOrganizationMembers(params: {
  organizationId: string;
  userId: string;
}) {
  const auth = getAuth();
  const ref = await getOrganizationById(params.organizationId);
  const organization = ref.data();

  // forbid requests if the user does not belong to the organization
  const userIsMember = params.userId in (organization?.members ?? {});

  if (!organization || !userIsMember) {
    throw new ApiError(HttpStatusCode.Forbidden, `Action Forbidden`);
  }

  const members = Object.values(organization.members);
  const data = members.map(({ user }) => auth.getUser(user.id));
  const extra = members.map(({ user }) => getUserData(user.id));
  const allPromises = [...data, ...extra];

  return Promise.all(allPromises);
}

/**
 * @name getOrganizationMembers
 * @description Returns the {@link UserInfo} object from the members of an organization
 */
export async function getTeamMembers(params: {
  organizationId: string;
  userId: string;
  teamId: string;
}) {
  const auth = getAuth();

  // forbid requests if there is no user

  if (!params.userId) {
    throw new ApiError(HttpStatusCode.Forbidden, `Action Forbidden`);
  }
  const data = auth.getUser(params.userId);
  const extra = getUserData(params.userId);
  const allPromises = [data, extra];

  return Promise.all(allPromises);
}

/**
 * @name removeMemberFromOrganization
 * @description Remove a member with ID userId from an Organization
 * @param params
 */
export async function removeMemberFromOrganization(params: {
  organizationId: string;
  targetUserId: string;
  currentUserId: string;
}) {
  const { targetUserId, currentUserId, organizationId } = params;
  const doc = await getOrganizationById(organizationId);
  const organization = doc.data();

  if (!organization) {
    throw throwNotFoundException();
  }

  assertUserCanUpdateMember({
    organization,
    currentUserId,
    targetUserId,
  });

  const memberPath = getMemberPath(targetUserId);

  const userRef = getOrganizationsCollection()
    .doc(organizationId)
    .collection('users')
    .doc(targetUserId);

  const docSnapshot = await userRef.get();

  if (docSnapshot.exists) {

    const acceptedInvitesRef = getAcceptedInvitesCollection().where("acceptedBy", "==", docSnapshot.id);
    const acceptedInvitesSnapshot = await acceptedInvitesRef.get();

    // Delete all matching accepted invites
    const deletePromises = acceptedInvitesSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);

    // Delete user from organization's subcollection
    await userRef.delete();

    // Remove member path from organization doc
    await doc.ref.update({
      [memberPath]: FieldValue.delete(),
    });
  }
}

/**
 * @name updateMemberRole
 * @description Update the role of a member within an organization
 * @param params
 */


function sendNotificationEmail(props: {
  updatedUserName: string;
  updatedUserEmail: string;
  organizationName: string;
  adminName: string;
  newRole: number;
  oldRole: number;
}) {
  const {
    updatedUserName,
    updatedUserEmail,
    organizationName,
    adminName,
    newRole,
    oldRole,
  } = props;

  function assertSiteUrl(siteUrl: Maybe<string>): asserts siteUrl is string {
    if (!siteUrl && configuration.production) {
      throw new Error(
        `Please configure the "siteUrl" property in the configuration file ~/configuration.ts`,
      );
    }
  }

  function getInvitePageFullUrl() {
    let siteUrl = configuration.site.siteUrl;

    assertSiteUrl(siteUrl);

    return [siteUrl, 'settings', 'organization', 'members'].join('/');
  }


  function getSelectedRoleModel(currentRole: any) {
    if (currentRole === 0) {
      return 'Member';
    } else if (currentRole === 1) {
      return 'Admin';
    }
  }
  const oldRoleName = getSelectedRoleModel(oldRole);
  const newRoleName = getSelectedRoleModel(newRole);
  const url = getInvitePageFullUrl();

  let data: any = {
    to: updatedUserEmail,
    subject: `${adminName} has updated your role of ${organizationName}`,
    template: 'updated role message',
    'v:names': updatedUserName,
    'v:adminName': adminName,
    'v:organizationName': organizationName,
    'v:oldRoleName': oldRoleName,
    'v:newRoleName': newRoleName,
    'v:link': url,
    'v:email': updatedUserEmail,
    'v:buttonTitle': 'Go to RetroTeam Settings',
  };

  void sendEmail(data);
}


export async function updateMemberRole(params: {
  organizationId: string;
  targetUserId: string;
  currentUserId: string;
  role: MembershipRole;
}) {
  const { role, currentUserId, targetUserId, organizationId } = params;
  const doc = await getOrganizationById(organizationId);
  const memberDoc = await getOrganizationMemberById(organizationId, targetUserId);
  const organization = doc.data();

  if (!organization) {
    throw throwNotFoundException();
  }

  assertUserCanUpdateMember({
    organization,
    currentUserId,
    targetUserId,
  });

  const user = await getUserRefById(targetUserId);
  const userUpdatedData = user.data();

  const currentUser = await getUserRefById(currentUserId);
  const currentUserData = currentUser.data();

  // Fetch the current (old) role before updating
  const oldRole = memberDoc.data()?.role;

  const memberPath = getMemberPath(targetUserId) as 'members.id';
  await memberDoc.ref.update({
    role,
  });
  await doc.ref.update({
    [memberPath]: {
      role,
      user: user.ref,
    },
  });

  // Send email
  sendNotificationEmail({
    updatedUserName: userUpdatedData?.fullName as string,
    updatedUserEmail: userUpdatedData?.email as string,
    organizationName: organization.name,
    adminName: currentUserData?.fullName as string,
    newRole: role as number,
    oldRole: oldRole as number,
  });
}


/**
 * @name acceptInviteToOrganization
 * @description Add a member to an organization by using the invite code
 */
export async function acceptInviteToOrganization({
  code,
  userId,
}: {
  code: string;
  userId: string;
}) {
  const firestore = getRestFirestore();
  const auth = getAuth();
  const batch = firestore.batch();
  const inviteDoc = await getInviteByCode(code);

  if (!inviteDoc?.exists) {
    throw new ApiError(HttpStatusCode.NotFound, `Invite not found`);
  }

  const invite = inviteDoc.data();
  const currentTime = new Date().getTime();
  const createdTime =
    invite.created._seconds * 1000 + invite.created._nanoseconds / 1000000;
  const passedDays = (currentTime - createdTime) / (1000 * 60 * 60 * 24); // Calculating days
  const isInviteExpired = passedDays >= 14; // Checking if 14 days have passed

  if (isInviteExpired) {
    await inviteDoc.ref.delete();

    throw new Error(`Invite is expired`);
  }

  const organizationId = invite.organization.id;
  const teamId = invite.team.id;

  const role = invite.role;

  const organizationRef = firestore.doc(
    `/${ORGANIZATIONS_COLLECTION}/${organizationId}`,
  );
  const teamRef = firestore.doc(
    `/${ORGANIZATIONS_COLLECTION}/${organizationId}/${TEAMS_COLLECTION}/${teamId}`,
  );

  let userPath;
  let userRef;

  // If the user has no account, create a document

  if (userId) {
    userPath = `/${USERS_COLLECTION}/${userId}`;
    userRef = firestore.doc(userPath);
  } else {
    const newUserRef = firestore.collection(USERS_COLLECTION).doc();
    userId = newUserRef.id;
  }

  // update the organization members list
  const memberPath = getMemberPath(userId);

  const membersCollectionRef = firestore.doc(
    `/${ORGANIZATIONS_COLLECTION}/${organizationId}/users/${userId}`,
  );

  const teamsMembersCollectionRef = firestore.doc(
    `/${ORGANIZATIONS_COLLECTION}/${organizationId}/${TEAMS_COLLECTION}/${teamId}/users/${userId}`,
  );

  const acceptInviteCollectionRef = firestore.doc(
    `/${ORGANIZATIONS_COLLECTION}/${organizationId}/${ACCEPTED_INVITES_COLLECTION}/${inviteDoc.id}`,
  );

  const organizationDoc = await organizationRef.get();
  const organizationData = organizationDoc.data();

  if (organizationData) {
    const isPartOfOrganization = organizationData.members[userId];
    if (!isPartOfOrganization) {
      // Add user to organization members
      batch.create(membersCollectionRef, { user: userRef, role, userId });

      batch.update(organizationRef, {
        [memberPath]: {
          user: userRef,
          role,
        },
      });

      // Add user to team members
      batch.create(teamsMembersCollectionRef, { user: userRef, active: true, userId });

      batch.update(teamRef, {
        [memberPath]: {
          user: userRef,
          userId: userId,
        },
      });

      // If accepted invites doesnt exist with this email, create it

      const collection = getAcceptedInvitesCollection();
      const query = collection.where('email', '==', invite.email);
      const acceptInviteRef = await query.get();

      if (acceptInviteRef.empty) {
        batch.create(acceptInviteCollectionRef, {
          ...invite,
          acceptedAt: new Date(),
          acceptedBy: userId,
        });
      }

      // delete the invite
      batch.delete(inviteDoc.ref);
    }
  }

  // automatically verify user email (since they are invited)
  const updateEmail = auth.updateUser(userId, {
    emailVerified: true,
  });

  // automatically set the user as "onboarded"
  const setOnboardedClaims = auth.setCustomUserClaims(userId, {
    onboarded: true,
  });

  return Promise.all([updateEmail, setOnboardedClaims, batch.commit()]);
}
/**
 * @name acceptInviteToOrganizationTeam
 * @description Add a member to an organization team by using the invite code
 */
export async function acceptInviteToOrganizationTeam({
  code,
  userId,
}: {
  code: string;
  userId: string;
}) {
  const firestore = getRestFirestore();
  const auth = getAuth();
  const batch = firestore.batch();

  try {
    const inviteDoc = await getTeamInviteByCode(code);

    if (!inviteDoc?.exists) {
      throw new ApiError(HttpStatusCode.NotFound, `Invite not found`);
    }

    const invite = inviteDoc.data();
    const currentTime = Date.now();
    const createdTime =
      invite.created._seconds * 1000 + invite.created._nanoseconds / 1000000;
    const passedHours = (currentTime - createdTime) / (1000 * 60 * 60);

    if (passedHours >= 24) {
      await inviteDoc.ref.delete();
      throw new ApiError(HttpStatusCode.NotFound, `Invite has expired`);
    }

    const { id: organizationId } = invite.organization;
    const { id: teamId } = invite.team;

    const userRef = firestore.doc(`/${USERS_COLLECTION}/${userId}`);
    const organizationRef = firestore.doc(`/${ORGANIZATIONS_COLLECTION}/${organizationId}`);
    const organizationMembersRef = firestore.doc(`/${ORGANIZATIONS_COLLECTION}/${organizationId}/users/${userId}`);
    const teamRef = firestore.doc(`/${ORGANIZATIONS_COLLECTION}/${organizationId}/teams/${teamId}`);
    const teamMembersRef = firestore.doc(`/${ORGANIZATIONS_COLLECTION}/${organizationId}/teams/${teamId}/users/${userId}`);
    const acceptedInviteRef = firestore.doc(`/${ORGANIZATIONS_COLLECTION}/${organizationId}/${ACCEPTED_INVITES_COLLECTION}/${inviteDoc.id}`);

    const memberPath = getMemberPath(userId);

    // Add user to team
    batch.update(teamRef, {
      [memberPath]: {
        userId,
        user: userRef,
        active: true,
      },
    });

    batch.create(teamMembersRef, {
      user: userRef,
      userId,
      active: true,
    });

    const organizationDoc = await organizationRef.get();
    const organizationData = organizationDoc.data();

    if (organizationData && !organizationData.members?.[userId]) {
      batch.update(organizationRef, {
        [`members.${userId}`]: {
          user: userRef,
          role: 0,
        },
      });

      batch.create(organizationMembersRef, {
        userId,
        user: userRef,
        role: 0,
      });

      // Ensure accepted invite does not already exist
      const acceptedInvitesCollection = getAcceptedInvitesCollection();
      const existingAcceptedInvite = await acceptedInvitesCollection
        .where('email', '==', invite.email)
        .limit(1)
        .get();

      if (existingAcceptedInvite.empty) {
        batch.create(acceptedInviteRef, {
          ...invite,
          acceptedAt: new Date(),
          acceptedBy: userId,
        });
      }
    }

    // Delete invite
    batch.delete(inviteDoc.ref);

    // Commit Firestore batch
    await batch.commit();

    // Fire user authentication updates in parallel
    return Promise.all([
      auth.updateUser(userId, { emailVerified: true }),
      auth.setCustomUserClaims(userId, { onboarded: true }),
    ]);
  } catch (error) {
    console.error('Error accepting invite:', error);
    throw new ApiError(HttpStatusCode.InternalServerError, 'An error occurred while accepting the invite');
  }
}


/**
 * @name addMemberToOrganization
 * @description Adds a user to an organization and its first team, and sets up default permissions.
 */
export async function addMemberToOrganization({
  organizationId,
  userId,
}: {
  organizationId: string;
  userId: string;
}) {
  const firestore = getRestFirestore();
  const auth = getAuth();
  const batch = firestore.batch();

  const organizationDoc = await getOrganizationById(organizationId);
  const organizationRef = organizationDoc.ref;
  const organizationData = organizationDoc.data();

  if (!organizationData || organizationData.members[userId]) return;

  const userRef = firestore.doc(`/${USERS_COLLECTION}/${userId}`);
  const memberPath = getMemberPath(userId);
  const memberRef = firestore.doc(
    `/${ORGANIZATIONS_COLLECTION}/${organizationId}/users/${userId}`
  );

  // Add user to organization members
  batch.create(memberRef, { user: userRef, role: MembershipRole.Member, userId });

  batch.update(organizationRef, {
    [memberPath]: {
      user: userRef,
      role: MembershipRole.Member,
    },
  });

  // Add user to the first available team
  const teamsCollectionRef = firestore.collection(
    `/${ORGANIZATIONS_COLLECTION}/${organizationId}/${TEAMS_COLLECTION}`
  );
  const teamsSnapshot = await teamsCollectionRef.limit(1).get();
  const firstTeam = teamsSnapshot.docs[0];

  if (firstTeam) {
    const teamId = firstTeam.id;
    const teamRef = firstTeam.ref;
    const teamMemberRef = firestore.doc(
      `/${ORGANIZATIONS_COLLECTION}/${organizationId}/${TEAMS_COLLECTION}/${teamId}/users/${userId}`
    );

    batch.create(teamMemberRef, { user: userRef, active: true, userId });

    batch.update(teamRef, {
      [memberPath]: {
        user: userRef,
        userId,
      },
    });
  }

  // Add accepted invite record if it doesn't exist
  const acceptedInvitesCollection = getAcceptedInvitesCollection();
  const existingInvite = await acceptedInvitesCollection
    .where('acceptedBy', '==', userId)
    .get();

  if (existingInvite.empty) {
    const acceptedInviteRef = firestore.doc(
      `/${ORGANIZATIONS_COLLECTION}/${organizationId}/${ACCEPTED_INVITES_COLLECTION}/${userId}`
    );
    

    batch.create(acceptedInviteRef, {
      acceptedAt: new Date(),
      provider: 'token',
      acceptedBy: userId,
    });
  }

  // Mark user's email as verified
  const updateEmail = auth.updateUser(userId, {
    emailVerified: true,
  });

  // Mark user as onboarded
  const setOnboardedClaims = auth.setCustomUserClaims(userId, {
    onboarded: true,
  });
console.log("userId", userId)
  return Promise.all([updateEmail, setOnboardedClaims, batch.commit()]);
}

function getMemberPath(userId: string) {
  const membersPropertyKey: keyof Organization = 'members';

  return `${membersPropertyKey}.${userId}`;
}

/**
 * @name assertUserCanUpdateMember
 * @description Return an error when the current user cannot alter data of
 * the target user
 * @param params
 */
function assertUserCanUpdateMember(params: {
  organization: Organization;
  currentUserId: string;
  targetUserId: string;
}) {
  const members = params.organization.members;
  const currentUser = members[params.currentUserId];
  const targetUser = members[params.targetUserId];

  if (!targetUser) {
    return throwNotFoundException(`Target member was not found`);
  }

  if (!currentUser) {
    return throwNotFoundException(`Current member was not found`);
  }

  if (currentUser.role < targetUser.role) {
    return throwUnauthorizedException(
      `Current member does not have a greater role than target member`,
    );
  }
}

/**
 * @name getInviteByCode
 * @description Fetch an invite by its ID, without having to know the
 * organization it belongs to
 * @param code
 */
export async function getInviteByCode(code: string) {
  if (code == null || code === '') {
    return undefined;
  }
  const collection = getInvitesCollection();
  const path: keyof MembershipInvite = 'code';
  const op = '==';

  const query = collection.where(path, op, code);
  const ref = await query.get();

  if (ref.size) {
    return ref.docs[0];
  }
}

/**
 * @name deleteInviteByCode
 * @description Delete an invite by its ID, without having to know the
 * organization it belongs to
 * @param code
 */
export async function deleteInviteByCode(code: string) {
  if (code == null || code === '') {
    return false;
  }
  const collection = getInvitesCollection();
  const path: keyof MembershipInvite = 'code';
  const op = '==';

  const query = collection.where(path, op, code);
  const ref = await query.get();

  if (ref.size) {
    const doc = ref.docs[0];
    await doc.ref.delete();
    return true;
  }

  return false;
}


/**
 * @name getTeamInviteByCode
 * @description Fetch an invite by its ID, without having to know the
 * organization it belongs to
 * @param code
 */
export async function getTeamInviteByCode(code: string) {
  if (code == null || code === '') {
    return undefined;
  }
  const collection = getTeamInvitesCollection();
  const path: keyof TeamMembershipInvite = 'code';
  const op = '==';

  const query = collection.where(path, op, code);
  const ref = await query.get();

  if (ref.size) {
    return ref.docs[0];
  }
}

/**
 * @description Get the role of a user given an organization ID
 * @param params
 */
export async function getUserRoleByOrganization(params: {
  userId: string;
  organizationId: string;
}) {
  const ref = await getOrganizationById(params.organizationId);
  const data = ref.data();

  return data?.members[params.userId]?.role;
}

export async function getUserRoleByTeam(params: {
  userId: string;
  organizationId: string | any;
  teamId: string | any;
}) {
  const ref = await getTeamMemberById(
    params.organizationId,
    params.teamId,
    params.userId,
  );
  const data = ref.data();

  return data;
}

