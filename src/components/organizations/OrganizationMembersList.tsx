import { Trans } from 'next-i18next';

import Badge from '~/core/ui/Badge';

import { useFetchOrganization } from '~/lib/organizations/hooks/use-fetch-organization';
import { canUpdateUser } from '~/lib/organizations/permissions';
import { useFetchOrganizationMembersMetadata } from '~/lib/organizations/hooks/use-fetch-members-metadata';
import { Organization } from '~/lib/organizations/types/organization';

import { useUserId } from '~/core/hooks/use-user-id';
import LoadingMembersSpinner from '~/components/organizations/LoadingMembersSpinner';

import OrganizationMembersActionsContainer from './OrganizationMembersActionsContainer';
import Alert from '~/core/ui/Alert';

import ChevronDownIcon from 'public/assets/svg/caret-sort.svg';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { MembershipRole } from '~/lib/organizations/types/membership-role';

import useFetchOrganizationMembers from '~/lib/server/organizations/get-members';
import PaginationController from '../shared/paginationController';
import roles from '~/lib/organizations/roles';
import If from '~/core/ui/If';
import UserImage from '../dashboard/UserImage';

const DEFAULT_ROWS = 10;

const OrganizationMembersList: React.FCC<{
  organizationId: string;
  setTotalMembers: (total: number) => void;
  isAdminTable?: boolean;
}> = ({ organizationId, setTotalMembers, isAdminTable = false }) => {
  const userId = useUserId();

  // fetch the organization members with an active listener
  // and re-render on changes
  const { data: organization, status } = useFetchOrganization(organizationId);

  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS);
  const [sorted, setSorted] = useState(true);

  const {
    members: membersData,
    loading: loadingMembers,
    admins,
    totalPages,
    currentPage,
    refetch,
    totalMembers,
    allAdmins,
  } = useFetchOrganizationMembers(organizationId, rowsPerPage, sorted);

  const [memberList, setMembersList] = useState<any[]>([]);

  useEffect(() => {
    if (isAdminTable) {
      setMembersList(allAdmins);
      setTotalMembers(admins);
    } else {
      setMembersList(membersData);
      setTotalMembers(membersData.length);
    }
  }, [admins, membersData, totalMembers, isAdminTable]);

  // fetch the metadata from the admin
  // so that we can display email/name and profile picture
  const {
    data: membersMetadata,
    isLoading: loading,
    error,
  } = useFetchOrganizationMembersMetadata(organizationId);

  const isLoading = status === 'loading' || loading || loadingMembers;

  if (isLoading) {
    return (
      <LoadingMembersSpinner>
        <Trans i18nKey={'organization:loadingMembers'} />
      </LoadingMembersSpinner>
    );
  }

  if (error) {
    return (
      <Alert type={'error'}>
        <Trans i18nKey={'organization:loadMembersError'} />
      </Alert>
    );
  }

  const members = getSortedMembers(organization);
  const currentUser = members?.find((member) => member.id === userId);

  if (!currentUser) {
    return null;
  }

  const userRole = currentUser.role;

  const Content = ({
    isCurrentUser,
    metadata,
    userId,
    role,
    email,
    fullName,
  }: any) => {
    function getSelectedRoleModel(currentRole: MembershipRole | undefined) {
      const role = roles.find((role) => {
        return role.value === currentRole;
      });

      return role?.label;
    }
    const shouldEnableActions =
      canUpdateUser(userRole, role) ||
      (userRole > MembershipRole.Member &&
        role > MembershipRole.Member &&
        admins > 1);
    return (
      <>
        <tr className="hover:bg-zinc-50 border-b border-[#E4E4E7] text-xs">
          <th className="w-auto px-4 py-2 flex space-x-4">
            <div className="flex space-x-2 items-center">
              {' '}
              <UserImage
                organizationId={organizationId}
                selectedMember={userId}
              />
              <div>
                <p className="text-sm font-normal text-left">{fullName}</p>
                <p className="text-sm font-normal text-left">{email}</p>
              </div>
            </div>
            {isCurrentUser && (
              <Badge size={'custom'}>
                <Trans i18nKey={'organization:youBadgeLabel'} />
              </Badge>
            )}
          </th>
          <th className="px-4 py-2 m-auto">
            <div
              className="w-[45%] flex items-center justify-between"
              key={userId}
            >
              <p className="border px-2.5 py-0.5 rounded-md">
                <Trans i18nKey={getSelectedRoleModel(role)} />
              </p>
            </div>
          </th>

          <th className="relative w-auto px-4 py-2">
            <OrganizationMembersActionsContainer
              disabled={!shouldEnableActions}
              targetMember={metadata}
              targetMemberRole={role}
              currentUserRole={userRole}
              refetch={() => refetch(currentPage)}
            />
          </th>
        </tr>
      </>
    );
  };

  return (
    <div>
      <div
        style={{ width: '-webkit-fill-available' }}
        className={
          ' mb-6 w-auto m-auto md:m-0 md:w-fit rounded-md overflow-x-auto text-xs'
        }
      >
        <table className="w-full border rounded-md">
          <thead className="border border-b text-left">
            <tr>
              <th className="items-center flex px-3 py-2 space-x-2">
                <p className="font-medium text-xs text-[#71717A]">
                  Member Email
                </p>
                <button
                  disabled={members && members?.length > 1 ? false : true}
                  onClick={() => {
                    setSorted(!sorted);
                  }}
                >
                  <Image
                    src={ChevronDownIcon}
                    alt="ChevronDownIcon"
                    className="h-4"
                  />
                </button>
              </th>
              <th className="px-3 py-2">
                <p className="font-medium text-sm text-[#71717A]">Role</p>
              </th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {memberList.map(({ fullName, email, role, userId: memberId }) => {
              const metadata = membersMetadata?.find((metadata) => {
                return metadata.uid === memberId;
              });

              if (!metadata) {
                return null;
              }

              const isCurrentUser = userId === metadata.uid;

              // check if user has the permissions to update another member of
              // the organization. If it returns false, the actions' dropdown
              // should be disabled

              const key = `${metadata.uid}:${userRole}`;

              return (
                <Content
                  key={key}
                  userId={memberId}
                  isCurrentUser={isCurrentUser}
                  metadata={metadata}
                  fullName={fullName}
                  email={email}
                  currentUserRole={userRole}
                  role={role}
                />
              );
            })}
          </tbody>
        </table>
      </div>{' '}
      <If condition={!isAdminTable}>
        <PaginationController
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          totalPages={totalPages}
          currentPage={currentPage}
          refetch={refetch}
        />
      </If>
    </div>
  );
};

export default OrganizationMembersList;

/**
 * @description Return the list of members sorted by role {@link MembershipRole}
 * @param organization
 */
function getSortedMembers(organization: WithId<Organization>) {
  if (organization) {
    const membersIds = Object.keys(organization.members ?? {});

    return membersIds
      .map((memberId) => {
        const member = organization.members[memberId];

        return {
          ...member,
          id: memberId,
        };
      })
      .sort((prev, next) => {
        return next.role > prev.role ? 1 : -1;
      });
  }
}
