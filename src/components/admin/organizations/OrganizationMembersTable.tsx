import type { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';

import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline';

import DataTable from '~/core/ui/DataTable';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/core/ui/Dropdown';

import IconButton from '~/core/ui/IconButton';
import Badge from '~/core/ui/Badge';
import If from '~/core/ui/If';

import { MembershipRole } from '~/lib/organizations/types/membership-role';
import RoleBadge from '~/components/organizations/RoleBadge';

import ImpersonateUserModal from '~/components/admin/users/ImpersonateUserModal';
import DisableUserModal from '~/components/admin/users/DisableUserModal';
import ReactivateUserModal from '~/components/admin/users/ReactivateUserModal';
import { Fragment, useEffect, useState } from 'react';
import PageLoadingIndicator from '~/core/ui/PageLoadingIndicator';
import Image from 'next/image';

import ChevronDoubleDownIcon from 'public/assets/svg/caret-sort.svg';

type Data = {
  role: MembershipRole;
  id: string;
  email: string | undefined;
  emailVerified: boolean;
  displayName: string | undefined;
  photoURL: string | undefined;
  phoneNumber: string | undefined;
  disabled: boolean;
};

function OrganizationsMembersTable({ members }: { members: Data[] }) {
  const [loadingImpersonate, setLoadingImpersonate] = useState(false);

  const [sortEmail, setSortEmail] = useState('');
  const [sortName, setSortName] = useState('');
  const [sortRole, setSortRole] = useState('');
  const [sortStatus, setSortStatus] = useState('');

  const [filteredMembers, setFilteredMembers] = useState<any>([]);

  const columns: ColumnDef<Data>[] = [
    {
      header: 'User ID',
      id: 'user-id',
      cell: ({ row }) => {
        const userId = row.original.id;

        return (
          <Link className={'hover:underline'} href={`/admin/users/${userId}`}>
            {userId}
          </Link>
        );
      },
    },
    {
      header: () => {
        return (
          <button
            className="flex space-x-2 items-center"
            onClick={() => {
              setSortName('');
              setSortRole('');
              setSortStatus('');
              if (sortEmail === 'asc') {
                setSortEmail('desc');
              } else {
                setSortEmail('asc');
              }
            }}
          >
            Email
            <Image
              src={ChevronDoubleDownIcon}
              alt="ChevronDownIcon"
              className="h-4"
            />
          </button>
        );
      },
      id: 'email',
      accessorKey: 'email',
    },
    {
      header: () => {
        return (
          <button
            className="flex space-x-2 items-center"
            onClick={() => {
              setSortEmail('');
              setSortRole('');
              setSortStatus('');
              if (sortName === 'asc') {
                setSortName('desc');
              } else {
                setSortName('asc');
              }
            }}
          >
            Name
            <Image
              src={ChevronDoubleDownIcon}
              alt="ChevronDownIcon"
              className="h-4"
            />
          </button>
        );
      },
      id: 'name',
      accessorKey: 'displayName',
    },
    {
      header: () => {
        return (
          <button
            className="flex space-x-2 items-center"
            onClick={() => {
              setSortEmail('');
              setSortName('');
              setSortStatus('');
              if (sortRole === 'asc') {
                setSortRole('desc');
              } else {
                setSortRole('asc');
              }
            }}
          >
            Role
            <Image
              src={ChevronDoubleDownIcon}
              alt="ChevronDownIcon"
              className="h-4"
            />
          </button>
        );
      },
      id: 'role',
      accessorKey: 'role',
      cell: ({ row }) => {
        return (
          <div className={'inline-flex'}>
            <RoleBadge role={row.original.role} />
          </div>
        );
      },
    },
    {
      header: () => {
        return (
          <button
            className="flex space-x-2 items-center"
            onClick={() => {
              setSortEmail('');
              setSortStatus('');
              setSortName('');
              if (sortStatus === 'asc') {
                setSortStatus('desc');
              } else {
                setSortStatus('asc');
              }
            }}
          >
            Status
            <Image
              src={ChevronDoubleDownIcon}
              alt="ChevronDownIcon"
              className="h-4"
            />
          </button>
        );
      },
      id: 'status',
      cell: ({ row }) => {
        const { disabled } = row.original;
        const color = disabled ? 'error' : 'success';
        const label = disabled ? 'Disabled' : 'Active';

        return (
          <div className={'inline-flex'}>
            <Badge size={'small'} color={color}>
              {label}
            </Badge>
          </div>
        );
      },
    },
    {
      header: 'Actions',
      cell: ({ row }) => {
        const membership = row.original;
        const userId = membership.id;
        const disabled = membership.disabled;

        const displayName =
          membership.displayName || membership.phoneNumber || membership.id;

        const email = membership.email as string;

        return (
          <div className={'flex'}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <IconButton>
                  <span className="sr-only">Open menu</span>
                  <EllipsisHorizontalIcon className="h-4 w-4" />
                </IconButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/admin/users/${userId}`}>View User</Link>
                </DropdownMenuItem>

                <If condition={!disabled}>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <ImpersonateUserModal
                      setLoadingImpersonate={setLoadingImpersonate}
                      userId={userId}
                      displayName={displayName}
                    >
                      Impersonate
                    </ImpersonateUserModal>
                  </DropdownMenuItem>

                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <DisableUserModal
                      email={email}
                      userId={userId}
                      displayName={displayName}
                    >
                      <span className={'text-red-500'}>Disable</span>
                    </DisableUserModal>
                  </DropdownMenuItem>
                </If>

                <If condition={disabled}>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <ReactivateUserModal
                      userId={userId}
                      displayName={displayName}
                      email={email}
                    >
                      Reactivate
                    </ReactivateUserModal>
                  </DropdownMenuItem>
                </If>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  useEffect(() => {
    let filteredMembers = [...members];

    if (sortEmail === 'asc' || sortEmail === 'desc') {
      filteredMembers = filteredMembers.sort((a: any, b: any) => {
        return sortEmail === 'asc'
          ? a.email.localeCompare(b.email)
          : b.email.localeCompare(a.email);
      });
    }

    if (sortName === 'asc' || sortName === 'desc') {
      filteredMembers = filteredMembers.sort((a: any, b: any) => {
        return sortName === 'asc'
          ? a.displayName.localeCompare(b.displayName)
          : b.displayName.localeCompare(a.displayName);
      });
    }

    if (sortRole === 'asc' || sortRole === 'desc') {
      filteredMembers = filteredMembers.sort((a: any, b: any) => {
        return sortRole === 'asc' ? a.role - b.role : b.role - a.role;
      });
    }

    if (sortStatus === 'asc' || sortStatus === 'desc') {
      filteredMembers = filteredMembers.sort((a: any, b: any) => {
        return sortStatus === 'asc'
          ? Number(a.disabled) - Number(b.disabled)
          : Number(b.disabled) - Number(a.disabled);
      });
    }

    setFilteredMembers(filteredMembers);
  }, [sortEmail, sortName, sortRole, sortStatus, members]);

  if (loadingImpersonate) {
    return <PageLoadingIndicator>Loading...</PageLoadingIndicator>;
  }

  return (
    <Fragment>
      <DataTable
        columns={columns}
        data={filteredMembers}
        tableProps={{
          'data-cy': 'admin-organization-members-table',
        }}
      />
    </Fragment>
  );
}

export default OrganizationsMembersTable;
