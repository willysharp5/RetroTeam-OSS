import { BoardMembershipInvite } from '~/lib/board/types/membership-role';
import {
  getAcceptedInvitesCollection,
  getBoardInvitesCollection,
  getOrganizationsCollection,
} from '../collections';
import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';
import { getAuth } from 'firebase-admin/auth';
import { ApiError } from 'next/dist/server/api-utils';
import { HttpStatusCode } from '~/core/generic/http-status-code.enum';
import {
  ACCEPTED_INVITES_COLLECTION,
  ORGANIZATIONS_COLLECTION,
  RETROSPECTIVES_COLLECTION,
  TEAMS_COLLECTION,
  USERS_COLLECTION,
} from '~/lib/firestore-collections';
import { Organization } from '~/lib/organizations/types/organization';
import { getRetrospectiveById } from '../queries';
import { throwNotFoundException } from '~/core/http-exceptions';
import { FieldValue } from 'firebase-admin/firestore';
import { MembershipRole } from '~/lib/organizations/types/membership-role';

/**
 * @name acceptInviteToBoard
 * @description Add a member to a board and organization by using the invite code
 */
export async function acceptInviteToBoard({
  code,
  userId,
  name,
  lastName,
  teamId,
  retrospectiveId,
}: {
  code: string;
  userId: string;
  name: string;
  lastName: string;
  teamId: string;
  retrospectiveId: string;
}) {
  const firestore = getRestFirestore();
  const auth = getAuth();
  const batch = firestore.batch();

  try {
    const inviteDoc = await getBoardInviteByCode(code);
    if (!inviteDoc?.exists) {
      throw new ApiError(HttpStatusCode.NotFound, `Invite not found`);
    }

    const invite = inviteDoc.data();
    const currentTime = Date.now();
    const createdTime = invite.created._seconds * 1000 + invite.created._nanoseconds / 1e6;
    const isInviteExpired = (currentTime - createdTime) / (1000 * 60 * 60) >= 24;

    if (isInviteExpired) {
      batch.delete(inviteDoc.ref);
      await batch.commit();
      throw new Error(`Invite is expired`);
    }

    const organizationId = invite.organization.id;
    const role = invite.role;
    const userPath = `/${USERS_COLLECTION}/${userId}`;
    const memberPath = getMemberPath(userId);

    const organizationRef = firestore.doc(`/${ORGANIZATIONS_COLLECTION}/${organizationId}`);
    const boardRef = firestore.doc(`/${ORGANIZATIONS_COLLECTION}/${organizationId}/${RETROSPECTIVES_COLLECTION}/${retrospectiveId}`);
    const boardMembersRef = firestore.doc(`${boardRef.path}/users/${userId}`);
    const userRef = firestore.doc(userPath);
    const teamRef = firestore.doc(`/${ORGANIZATIONS_COLLECTION}/${organizationId}/${TEAMS_COLLECTION}/${teamId}`);
    const acceptInviteCollectionRef = firestore.doc(`/${ORGANIZATIONS_COLLECTION}/${organizationId}/${ACCEPTED_INVITES_COLLECTION}/${inviteDoc.id}`);

    const [teamDoc, organizationDoc, boardDoc] = await Promise.all([teamRef.get(), organizationRef.get(), boardRef.get()]);

    if (!boardDoc.exists) throw new Error("Board document doesn't exist");
    if (!teamDoc.exists) throw new Error("Team document doesn't exist");

    const organizationData = organizationDoc.data();
    const isPartOfOrganization = organizationData?.members?.[userId];
    if (!isPartOfOrganization) {
      batch.update(organizationRef, {
        [memberPath]: { userId, user: userRef, role: MembershipRole.Member },
      });
      batch.set(firestore.doc(`${organizationRef.path}/users/${userId}`), {
        user: userRef,
        role: MembershipRole.Member,
        userId,
        active: true,
      });
    }

    const teamData = teamDoc.data();
    if (!teamData?.members?.[userId]) {
      batch.update(teamRef, { [memberPath]: { userId, user: userRef } });
      batch.set(firestore.doc(`${teamRef.path}/users/${userId}`), { user: userRef, userId, active: true });
    }

    batch.update(boardRef, {
      [memberPath]: { user: userRef, role, userId, active: true, created: new Date(), captureDone: false, voteDone: false },
    });
    batch.set(boardMembersRef, { user: userRef, role, userId, active: true, created: new Date() });
    batch.delete(inviteDoc.ref);

    const acceptInviteRef = await getAcceptedInvitesCollection().where('email', '==', invite.email).get();
    if (acceptInviteRef.empty) {
      batch.create(acceptInviteCollectionRef, { ...invite, acceptedAt: new Date(), acceptedBy: userId });
    }

    const userSnapshot = await userRef.get();
    if (!userSnapshot.exists) {
      const searchableName = (name + lastName).replace(' ', '').toLowerCase();
      batch.set(userRef, {
        name,
        lastName,
        fullName: `${name} ${lastName}`,
        searchableName,
        searchableLastName: lastName.toLowerCase(),
        email: '',
        createdAt: Date.now(),
      }, { merge: true });
    }

    await batch.commit();
    return Promise.all([
      auth.updateUser(userId, { emailVerified: true }),
      auth.setCustomUserClaims(userId, { onboarded: true }),
    ]);
  } catch (error: any) {
    console.error('Error on acceptInviteToBoard: ', error);
    return { success: false, message: error.message };
  }
}

/**
 * @name joinBoard
 * @description Add a member to a board by joining form
 */
export async function joinBoard({
  name,
  lastName,
  retrospectiveId,
  organizationId,
  userId,
  teamId,
}: {
  name: string;
  lastName: string;
  retrospectiveId: string;
  organizationId: string;
  userId: string;
  teamId: string;
}) {

  if (!retrospectiveId || !organizationId || !userId || !teamId) {
    throw new Error('All parameters are required');
  }
  const firestore = getRestFirestore();
  const auth = getAuth();
  const batch = firestore.batch();

  const now = new Date();
  const createdAt = now.getTime();
  const fullName = `${name} ${lastName}`;
  const memberPath = getMemberPath(userId);
  const teamPath = `/${ORGANIZATIONS_COLLECTION}/${organizationId}/${TEAMS_COLLECTION}/${teamId}`;

  const userRef = firestore.doc(`/${USERS_COLLECTION}/${userId}`);
  const orgMemberRef = firestore.doc(`/${ORGANIZATIONS_COLLECTION}/${organizationId}/${USERS_COLLECTION}/${userId}`);
  const orgRef = firestore.doc(`/${ORGANIZATIONS_COLLECTION}/${organizationId}`);
  const teamRef = firestore.doc(`${teamPath}`);
  const teamMemberRef = firestore.doc(`${teamPath}/${USERS_COLLECTION}/${userId}`);
  const boardRef = firestore.doc(`/${ORGANIZATIONS_COLLECTION}/${organizationId}/${RETROSPECTIVES_COLLECTION}/${retrospectiveId}`);
  const boardMemberRef = firestore.doc(`${boardRef.path}/${USERS_COLLECTION}/${userId}`);
  const acceptedInviteRef = firestore.doc(`/${ORGANIZATIONS_COLLECTION}/${organizationId}/${ACCEPTED_INVITES_COLLECTION}/${userId}`);

  const [userDoc, orgMemberDoc, teamMemberDoc] = await Promise.all([
    userRef.get(),
    orgMemberRef.get(),
    teamMemberRef.get(),
  ]);

  const createAcceptedInviteIfNeeded = async (email: string) => {
    const collection = getAcceptedInvitesCollection();
    const query = collection.where('acceptedBy', '==', userId);
    const snapshot = await query.limit(1).get();
    if (snapshot.empty) {
      batch.create(acceptedInviteRef, {
        email: email || 'anonymous',
        name,
        lastName,
        acceptedAt: now,
        acceptedBy: userId,
      });
    }
  };

  try {
    if (!userDoc.exists) {
      await userRef.set({
        name,
        lastName,
        fullName,
        searchableName: (name + lastName).replace(' ', '').toLowerCase(),
        searchableLastName: lastName.toLowerCase(),
        email: '',
        createdAt,
      }, { merge: true });

      await createAcceptedInviteIfNeeded('');
    } else {
      const data = userDoc.data();
      await createAcceptedInviteIfNeeded(data?.email || '');
    }

    if (!orgMemberDoc.exists) {
      batch.create(orgMemberRef, {
        user: userRef,
        role: MembershipRole.Member,
        userId,
        active: true,
        created: now,
      });
      batch.update(orgRef, {
        [memberPath]: {
          userId,
          user: userRef,
          role: MembershipRole.Member,
        },
      });
    }

    if (!teamMemberDoc.exists) {
      batch.create(teamMemberRef, {
        user: userRef,
        role: MembershipRole.Member,
        userId,
        active: true,
        created: now,
      });
      batch.update(teamRef, {
        [memberPath]: {
          userId,
          user: userRef,
          role: MembershipRole.Member,
        },
      });
    }

    // Add to board
    batch.create(boardMemberRef, {
      user: userRef,
      role: MembershipRole.Member,
      userId,
      active: true,
      created: now,
    });
    batch.update(boardRef, {
      [memberPath]: {
        user: userRef,
        role: MembershipRole.Member,
        userId,
        active: true,
        created: now,
      },
    });

    await batch.commit();

    await Promise.all([
      auth.updateUser(userId, { emailVerified: true }),
      auth.setCustomUserClaims(userId, { onboarded: true }),
    ]);
    return 'success';
  } catch (error) {
    console.error('Error in joinBoard:', error);
    throw new Error('Error joining board');
  }
}

/**
 * @name acceptRequest
 * @description Accept a member to a board
 */

interface acceptRequestParams {
  userId: string;
  organizationId: string;
  teamId?: string;
  retrospectiveId: string;
}

export async function acceptRequest({
  userId,
  organizationId,
  teamId,
  retrospectiveId
}: acceptRequestParams) {
  if (!retrospectiveId || !organizationId || !userId || !teamId) {
    throw new Error('All parameters are required');
  }

  const firestore = getRestFirestore();
  const auth = getAuth();
  const batch = firestore.batch();
  const now = new Date();

  // Refs
  const userRef = firestore.doc(`/${USERS_COLLECTION}/${userId}`);
  const organizationRef = firestore.doc(`/${ORGANIZATIONS_COLLECTION}/${organizationId}`);
  const orgMemberRef = firestore.doc(`/${ORGANIZATIONS_COLLECTION}/${organizationId}/${USERS_COLLECTION}/${userId}`);
  const teamRef = firestore.doc(`/${ORGANIZATIONS_COLLECTION}/${organizationId}/${TEAMS_COLLECTION}/${teamId}`);
  const teamMemberRef = firestore.doc(`${teamRef.path}/${USERS_COLLECTION}/${userId}`);
  const boardRef = firestore.doc(`/${ORGANIZATIONS_COLLECTION}/${organizationId}/${RETROSPECTIVES_COLLECTION}/${retrospectiveId}`);
  const boardMemberRef = firestore.doc(`${boardRef.path}/${USERS_COLLECTION}/${userId}`);
  const acceptedInviteRef = firestore.doc(`/${ORGANIZATIONS_COLLECTION}/${organizationId}/${ACCEPTED_INVITES_COLLECTION}/${userId}`);

  const memberPath = getMemberPath(userId);

  // Get documents
  const [orgMemberDoc, teamMemberDoc, acceptedInviteDoc] = await Promise.all([
    orgMemberRef.get(),
    teamMemberRef.get(),
    acceptedInviteRef.get(),
  ]);

  // Create Accepted Invite count
  if (!acceptedInviteDoc.exists) {
    console.log("Creating accepted invite for " + userId)
    batch.set(acceptedInviteRef, {
      acceptedAt: now,
      acceptedBy: userId,
    });
  }

  // Add member to organization
  if (!orgMemberDoc.exists) {
    console.log(`Adding member to organization ${organizationId}...`)
    batch.set(orgMemberRef, {
      user: userRef,
      userId,
      role: MembershipRole.Member,
      active: true,
      created: now,
    });

    batch.update(organizationRef, {
      [memberPath]: {
        userId,
        user: userRef,
        role: MembershipRole.Member,
      },
    });
  }

  // Add member to team
  if (!teamMemberDoc.exists) {
    console.log(`Adding member to team ${teamId}...`)
    batch.set(teamMemberRef, {
      user: userRef,
      userId,
      role: MembershipRole.Member,
      active: true,
      created: now,
    });
    batch.update(teamRef, {
      [memberPath]: {
        userId,
        user: userRef,
        role: MembershipRole.Member,
      },
    });
  }

  // Add member to board
  batch.set(boardMemberRef, {
    user: userRef,
    userId,
    role: MembershipRole.Member,
    active: true,
    created: now,
  });
  batch.update(boardRef, {
    [memberPath]: {
      user: userRef,
      role: MembershipRole.Member,
      userId,
      active: true,
      created: new Date(),
    },
  });
  console.log(`Adding member to board ${retrospectiveId}...`)

  try {
    await batch.commit();

  } catch (commitError) {
    console.error('Error on batch.commit():', commitError);
    throw commitError;
  }

  deleteRequest({ id: retrospectiveId, organization: organizationId, userId });

  // automatically verify user email (since they are invited) and set the user as "onboarded"
  try {
    await Promise.all([
      auth.updateUser(userId, { emailVerified: true }),
      auth.setCustomUserClaims(userId, { onboarded: true }),
    ]);
  } catch (authError) {
    console.error('Error updating Auth:', authError);
  }

  return 'success';
}


/**
 * @name denyBoardAccess
 * @description Deny access to a member on a board
 */
export async function denyBoardAccess({
  userId,
  organizationId,
  retrospectiveId,
}: acceptRequestParams) {
  const firestore = getRestFirestore();
  const batch = firestore.batch();
  const requestRef = getOrganizationsCollection()
    .doc(organizationId)
    .collection('board')
    .doc(retrospectiveId)
    .collection('requests')
    .doc(userId);

  try {
    batch.update(requestRef, {
      status: 'denied',
    });

    await batch.commit();

    const snapshot = await requestRef.get();
    const newData = snapshot.data();
    return newData;
  } catch (error) {
    console.error('Error', error);
    return null;
  }
}

export async function deleteRequest({ id, organization, userId }: any) {
  const firestore = getRestFirestore();
  const batch = firestore.batch();
  const requestRef = getOrganizationsCollection()
    .doc(organization)
    .collection('board')
    .doc(id)
    .collection('requests')
    .doc(userId);

  try {
    // Delete the specific request document
    batch.delete(requestRef);

    await batch.commit();

    // Return true to indicate successful deletion
    return true;
  } catch (error) {
    console.error('Error', error);
    return false;
  }
}

function getMemberPath(userId: string) {
  const membersPropertyKey: keyof Organization = 'members';

  return `${membersPropertyKey}.${userId}`;
}

/**
 * @name getInviteByCode
 * @description Fetch an invite by its ID, without having to know the
 * organization it belongs to
 * @param code
 */
export async function getBoardInviteByCode(code: string) {
  if (code == null || code === '') {
    return undefined;
  }
  const collection = getBoardInvitesCollection();
  const path: keyof BoardMembershipInvite = 'code';
  const op = '==';

  const query = collection.where(path, op, code);
  const ref = await query.get();

  if (ref.size) {
    return ref.docs[0];
  }
}

/**
 * @name removeMemberFromBoard
 * @description Remove a member with ID userId from a Board
 * @param params
 */
export async function removeMemberFromBoard(params: {
  organizationId: string;
  targetUserId: string;
  currentUserId: string;
  retrospectiveId: string;
}) {
  const { targetUserId, currentUserId, organizationId, retrospectiveId } =
    params;
  const doc = await getRetrospectiveById(organizationId, retrospectiveId);
  const organization = doc.data();

  if (!organization) {
    throw throwNotFoundException();
  }

  /* assertUserCanUpdateMember({
       organization,
       currentUserId,
       targetUserId,
     });*/

  const memberPath = getMemberPath(targetUserId);

  await doc.ref.update({
    [memberPath]: FieldValue.delete(),
  });
}
