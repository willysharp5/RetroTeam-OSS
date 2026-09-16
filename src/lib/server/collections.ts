import type {
  CollectionReference,
  CollectionGroup,
} from 'firebase-admin/firestore';

import { Organization } from '~/lib/organizations/types/organization';
import { UserData } from '~/core/session/types/user-data';
import {
  MembershipInvite,
  TeamMembershipInvite,
} from '~/lib/organizations/types/membership-invite';
import { Actions } from '../actions/types/actions';
import { Retrospectives } from '../retrospectives/types/retrospectives';
import { Templates } from '../templates/types/templates';
import {
  ORGANIZATIONS_COLLECTION,
  USERS_COLLECTION,
  INVITES_COLLECTION,
  ACTIONS_COLLECTION,
  RETROSPECTIVES_COLLECTION,
  TEMPLATES_COLLECTION,
  TEAMS_COLLECTION,
  CUSTOM_TEMPLATES_COLLECTION,
  BOARD_COLLECTION,
  RULES_COLLECTION,
  EMAILS_COLLECTION,
  ACCEPTED_INVITES_COLLECTION,
  DEMO_COLLECTION,
} from '~/lib/firestore-collections';

import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';
import { BoardMembershipInvite } from '../board/types/membership-role';
import { Email } from '../emails/types';
export function getUsersCollection() {
  return getCollectionByName(USERS_COLLECTION) as CollectionReference<UserData>;
}

export function getOrganizationsCollection() {
  return getCollectionByName(
    ORGANIZATIONS_COLLECTION,
  ) as CollectionReference<Organization>;
}

export function getTeamCollection(organizationId: string) {
  return getTeamCollectionByName(organizationId) as CollectionReference;
}

export function getTeamMembersCollection(
  organizationId: string,
  teamId: string,
) {
  return getTeamMemberCollectionByName(
    organizationId,
    teamId,
  ) as CollectionReference;
}

export function getInvitesCollection() {
  return getCollectionGroupByName(
    INVITES_COLLECTION,
  ) as CollectionGroup<MembershipInvite>;
}

export function getTeamInvitesCollection() {
  return getCollectionGroupByName(
    INVITES_COLLECTION,
  ) as CollectionGroup<TeamMembershipInvite>;
}

export function getAcceptedInvitesCollection() {
  return getCollectionGroupByName(
    ACCEPTED_INVITES_COLLECTION,
  ) as CollectionGroup<MembershipInvite>;
}


export function getRetrospectiveCollection(organizationId: string) {
  return getRetrospectiveCollectionByName(
    organizationId,
  ) as CollectionReference;
}

export function getBoardCollection(organizationId: string) {
  return getBoardCollectionByName(organizationId) as CollectionReference;
}

export function getBoardInvitesCollection() {
  return getCollectionGroupByName(
    INVITES_COLLECTION,
  ) as CollectionGroup<BoardMembershipInvite>;
}

export function getActionsCollection() {
  return getCollectionByName(
    ACTIONS_COLLECTION,
  ) as CollectionReference<Actions>;
}

export function getRetrospectivesCollection() {
  return getCollectionByName(
    RETROSPECTIVES_COLLECTION,
  ) as CollectionReference<Retrospectives>;
}

export function getTemplatesCollection() {
  return getCollectionByName(
    TEMPLATES_COLLECTION,
  ) as CollectionReference<Templates>;
}

export function getCustomTemplatesCollection(
  organizationId: string,
  teamId: string,
) {
  return getCustomTemplatesByName(
    organizationId,
    teamId,
  ) as CollectionReference;
}

function getCollectionByName(collection: string) {
  return getRestFirestore().collection(collection);
}

function getCollectionGroupByName(collection: string) {
  return getRestFirestore().collectionGroup(collection);
}

function getTeamCollectionByName(organizationId: string) {
  return getRestFirestore()
    .collection(ORGANIZATIONS_COLLECTION)
    .doc(organizationId)
    .collection(TEAMS_COLLECTION);
}

function getTeamMemberCollectionByName(organizationId: string, teamId: string) {
  return getRestFirestore()
    .collection(ORGANIZATIONS_COLLECTION)
    .doc(organizationId)
    .collection(TEAMS_COLLECTION)
    .doc(teamId)
    .collection(USERS_COLLECTION);
}

function getCustomTemplatesByName(organizationId: string, teamId: string) {
  return getRestFirestore()
    .collection(ORGANIZATIONS_COLLECTION)
    .doc(organizationId)
    .collection(TEAMS_COLLECTION)
    .doc(teamId)
    .collection(CUSTOM_TEMPLATES_COLLECTION);
}

function getRetrospectiveCollectionByName(organizationId: string) {
  return getRestFirestore()
    .collection(ORGANIZATIONS_COLLECTION)
    .doc(organizationId)
    .collection(RETROSPECTIVES_COLLECTION);
}

function getBoardCollectionByName(organizationId: string) {
  return getRestFirestore()
    .collection(ORGANIZATIONS_COLLECTION)
    .doc(organizationId)
    .collection(BOARD_COLLECTION);
}

export function getOrganizations() {
  return getRestFirestore().collection(ORGANIZATIONS_COLLECTION);
}

export function getRules() {
  return getRestFirestore().collection(RULES_COLLECTION);
}

export function getEmailsCollection() {
  return getCollectionByName(EMAILS_COLLECTION) as CollectionReference<Email>;
}

export function getDemoCollection() {
  return getCollectionByName(
    DEMO_COLLECTION,
  ) as CollectionReference<any>;
}