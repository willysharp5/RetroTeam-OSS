import { Trans, useTranslation } from 'next-i18next';
import toaster from 'react-hot-toast';
import { useFetchInvitedMembers } from '~/lib/organizations/hooks/use-fetch-invited-members';
import { canDeleteInvites } from '~/lib/organizations/permissions';

import resend from 'public/assets/svg/send_gray.svg';
import trash from 'public/assets/svg/trash.svg';
import copy from 'public/assets/svg/copy.svg';
import ChevronDownIcon from 'public/assets/svg/caret-sort.svg';

import { IfHasPermissions } from '~/components/IfHasPermissions';
import ProfileAvatar from '~/components/ProfileAvatar';
import { useCallback, useEffect, useState } from 'react';
import { useInviteMembers } from '~/lib/organizations/hooks/use-invite-members';
import { useDeleteInvite } from '~/lib/organizations/hooks/use-delete-invite';
import Image from 'next/image';

import { getSelectedRoleModel } from '../utils/getRoleLabel';
import { dayPassed } from '../utils/daysCounter';
import PaginationController from '../shared/paginationController';
import LoadingMembersSpinner from './LoadingMembersSpinner';
import If from '~/core/ui/If';
import DropdownOptions from '../shared/dropdownOptions';
import configuration from '~/configuration';

const DEFAULT_ROWS = 10;

const OrganizationInvitedMembersList: React.FCC<{
  organizationId: string;
  teamId: string;
  facilitator: string;
  setTotalPendingInvites: (invites: number) => void;
  type?: string;
}> = ({
  organizationId,
  teamId,
  facilitator,
  setTotalPendingInvites,
  type = 'all',
}) => {
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS);
  const [sorted, setSorted] = useState(true);

  const {
    data,
    adminsInvites,
    totalPages,
    currentPage,
    loading,
    refetch,
    totalInvitations,
  } = useFetchInvitedMembers(organizationId, type, rowsPerPage, sorted);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (type === 'all') {
      if (data) setMembers(data);
      setTotalPendingInvites(totalInvitations);
    } else {
      if (adminsInvites) {
        setMembers(adminsInvites);
        setTotalPendingInvites(adminsInvites.length);
      }
    }
  }, [data, adminsInvites, totalInvitations]);

  if (!members?.length) {
    return (
      <div className="w-full border border-[#E4E4E7] rounded-md">
        <p className="py-16 text-center">No invitations</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {loading ? (
        <LoadingMembersSpinner />
      ) : (
        <div className="space-y-6">
          <div
            style={{ width: '-webkit-fill-available' }}
            className="w-auto m-auto md:m-0 md:w-fit space-y-4 rounded-md overflow-x-auto text-xs  mb-6"
          >
            <table className="w-full border rounded-md w-auto m-auto md:m-0 border border-[#E4E4E7] rounded-md overflow-x-auto text-xs">
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
                  <th className="px-3 py-2">
                    <p className="font-medium text-sm text-[#71717A]">Sent</p>
                  </th>
                  <th className="px-3 py-2">
                    <p className="font-medium text-sm text-[#71717A]">Status</p>
                  </th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {members.map(({ email, role, code, id, created }: any) => {
                  return (
                    <MemberList
                      key={'invite' + email}
                      email={email}
                      role={role}
                      code={code}
                      id={id}
                      created={created}
                      facilitator={facilitator}
                      refetch={refetch}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
          <If condition={type === 'all'}>
            <PaginationController
              rowsPerPage={rowsPerPage}
              setRowsPerPage={setRowsPerPage}
              totalPages={totalPages}
              currentPage={currentPage}
              refetch={refetch}
            />
          </If>
        </div>
      )}
    </div>
  );

  function MemberList({
    email,
    role,
    code,
    id,
    created,
    facilitator,
    refetch,
  }: any) {
    const { t } = useTranslation('organization');

    const isExpired = (timestamp: { seconds: number; nanoseconds: number }) => {
      const timestampDate = new Date(
        timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000,
      );
      const currentDate = new Date();

      const timeDifference = currentDate.getTime() - timestampDate.getTime();

      const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

      if (days > 0) {
        return true;
      }

      return false;
    };

    const { trigger, isMutating } = useInviteMembers(organizationId, teamId);

    const [status, setStatus] = useState(isExpired(created));

    const onResend = useCallback(async () => {
      const body = [
        {
          email: email,
          role: 1,
          facilitator: facilitator,
        },
      ] as any;

      const promise = trigger(body);

      await toaster.promise(promise, {
        success: 'Invitation resent',
        error: t(`inviteMembersError`),
        loading: `Resending invitation`,
      });
    }, [trigger, t, facilitator, email]);
    useDeleteInvite();

    const deleteRequest = useDeleteInvite();

    const onInviteDeleteRequested = useCallback(() => {
      void (async () => {
        try {
          const promise = deleteRequest(organizationId, code).then((res) => {
            refetch();
          });

          await toaster.promise(promise, {
            success: t(`deleteInviteSuccessMessage`),
            error: t(`deleteInviteErrorMessage`),
            loading: t(`deleteInviteLoadingMessage`),
          });
        } catch (e) {
          console.error('Error on onInviteDeleteRequested' + e);
        }
      })();
    }, [deleteRequest, t, code, refetch]);

    // Outbound email is optional in this build, so the invite link has to be
    // obtainable without it — otherwise an install with no SMTP could never
    // invite anyone.
    const onCopyInviteLink = useCallback(() => {
      const inviteLink = `${configuration.site.siteUrl ?? ''}/auth/invite/${code}`;

      void (async () => {
        try {
          await navigator.clipboard.writeText(inviteLink);
          toaster.success('Invite link copied to your clipboard');
        } catch (e) {
          // Clipboard access can be blocked (e.g. an insecure origin): show
          // the link so it can still be copied by hand.
          toaster.success(inviteLink, { duration: 15000 });
        }
      })();
    }, [code]);

    const options = [
      {
        name: 'Resend',
        value: 'resend',
        icon: resend,
        action: onResend,
      },
      {
        name: 'Copy invite link',
        value: 'copy-link',
        icon: copy,
        action: onCopyInviteLink,
      },
      {
        name: 'Delete',
        value: 'delete',
        icon: trash,
        action: onInviteDeleteRequested,
      },
    ];

    return (
      <>
        <>
          <tr className="hover:bg-zinc-50 border-b border-[#E4E4E7] text-xs">
            <th className="w-auto px-4 py-2 flex space-x-4">
              <div className="flex space-x-2 items-center">
                {' '}
                <ProfileAvatar text={email} />
                <div>
                  <p className="text-sm font-normal text-left">{email}</p>
                </div>
              </div>
            </th>
            <th className="px-4 py-2 m-auto">
              <div className="w-[45%] flex items-center justify-between">
                <p className="border px-2.5 py-0.5 rounded-md">
                  <Trans i18nKey={getSelectedRoleModel(role)} />
                </p>
              </div>
            </th>

            <th className="relative w-auto px-4 py-2">
              <p className="text-sm font-normal text-left">
                {dayPassed(created)} days ago
              </p>
            </th>
            <th className="relative w-auto px-4 py-2">
              {status ? (
                <p className="text-sm font-normal text-left text-red-500">
                  Expired
                </p>
              ) : (
                <p className="text-sm font-normal text-left">Pending</p>
              )}
            </th>
            <th className="relative w-auto px-4 py-2">
              <IfHasPermissions condition={canDeleteInvites}>
                <DropdownOptions options={options} />
              </IfHasPermissions>
            </th>
          </tr>
        </>
      </>
    );
  }
};

export default OrganizationInvitedMembersList;
