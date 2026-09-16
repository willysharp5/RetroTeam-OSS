import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline';

import type { ColumnDef } from '@tanstack/react-table';

import usersIcon from 'public/assets/svg/users.svg';
import ChevronDoubleDownIcon from 'public/assets/svg/caret-sort.svg';
import arrowUp from 'public/assets/svg/arrowUp.svg';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/core/ui/Dropdown';

import If from '~/core/ui/If';
import IconButton from '~/core/ui/IconButton';

import ImpersonateUserModal from '~/components/admin/users/ImpersonateUserModal';
import DisableUserModal from '~/components/admin/users/DisableUserModal';
import ReactivateUserModal from '~/components/admin/users/ReactivateUserModal';
import DatePickerRange from '~/components/shared/datepickerRange';
import Image from 'next/image';

import PaginationController from '~/components/shared/paginationController';

import useSearchUsers from '~/lib/server/search/use-search-users';

type UserRow = {
  id: string;
  fullName?: string | null;
  name?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  created?: number;
  createdAt?: any;
  uid: string;
  email?: string | null;
  phoneNumber?: string | null;
  lastLoginAt?: number;
  photoURL?: string | null;
  disabled: boolean;
  lastSignIn?: string | null;
};

const DEFAULT_ROWS = 10;

function UsersTable({
  setLoadingImpersonate,
}: React.PropsWithChildren<{
  setLoadingImpersonate: (loading: boolean) => void;
}>) {
  const [search, setSearch] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchId, setSearchId] = useState('');

  const [sort, setSort] = useState('none');
  const [sortEmail, setSortEmail] = useState('none');

  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const { trigger: searchUsers } = useSearchUsers();

  const [activeSelectedTab, setActiveSelectedTab] = useState(0);

  const [usersFilter, setUsersFilter] = useState<any[]>([]);

  const [dateRange, setDateRange] = useState<any>({
    startDate: undefined,
    endDate: undefined,
  });

  const [createdSort, setCreatedSort] = useState('desc');
  const [loginSort, setLoginSort] = useState('none');

  const [totalUsers, setTotalUsers] = useState(0);

  const handleResultsPage = (page: number) => {
    setCurrentPage(page);
  };

  const onSearch = useCallback(async () => {
    const name = search?.replace(/\s+/g, '').toLowerCase();

    let startDateTime;
    let endDateTime;
    if (dateRange?.startDate && dateRange?.endDate) {
      const startDateF = new Date(dateRange.startDate);
      startDateF.setDate(startDateF.getDate() + 1);
      startDateF.setHours(0, 0, 0, 0);

      const endDateF = new Date(dateRange.endDate);
      endDateF.setDate(endDateF.getDate() + 1);
      endDateF.setHours(23, 59, 59, 999);

      startDateTime = Math.floor(startDateF.getTime());
      endDateTime = Math.floor(endDateF.getTime());
    }

    const body = {
      query: search,
      nameFilter: name,
      emailFilter: searchEmail,
      idFilter: searchId,
      statusFilter: activeSelectedTab,
      startDate: startDateTime,
      endDate: endDateTime,
      rowsPerPage: rowsPerPage,
      currentPage: currentPage,
      nameSort: sort,
      emailSort: sortEmail,
      createdSort: createdSort,
      loginSort: loginSort,
    };

    searchUsers(body)
      .then((res: any) => {
        setCurrentPage(res.page);
        const totalPages = Math.ceil(res.found / rowsPerPage);
        setTotalPages(totalPages);
        const results = res.hits;
        setTotalUsers(res.found);
        setUsersFilter(results);
        //  setLoading(false);
      })
      .catch((e) => {
        console.error('ERROR onSearch', e);
        //   setLoading(false);
      });
  }, [
    search,
    searchEmail,
    searchId,
    activeSelectedTab,
    dateRange,
    rowsPerPage,
    currentPage,
    sort,
    sortEmail,
    createdSort,
    loginSort,
    searchUsers,
  ]);

  useEffect(() => {
    onSearch();
  }, [
    activeSelectedTab,
    dateRange,
    createdSort,
    loginSort,
    searchEmail,
    searchId,
    search,
    rowsPerPage,
    currentPage,
    sort,
    sortEmail,
    createdSort,
  ]);

  const handleValueChange = (newValue: any) => {
    setDateRange(newValue);
  };

  const columns: Array<ColumnDef<UserRow>> = [
    {
      header: 'Id',
      id: 'id',
      cell: ({ row }) => {
        const id = row.original.id;
        const href = {
          pathname: `/admin/users/[id]`,
          query: {
            id,
          },
        };

        return (
          <Link href={href} className="hover:underline">
            {id}
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
              setCreatedSort('none');
              setLoginSort('none');
              setSortEmail('none');
              if (sort === 'asc') {
                setSort('desc');
              } else {
                setSort('asc');
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
      size: 50,
      id: 'displayName',
      cell: ({ row }) => {
        const name =
          (row.original.name && row.original.lastName
            ? row.original.name + ' ' + row.original.lastName
            : row.original.fullName) || row.original.displayName;

        return (
          <span title={name as string} className={'truncate max-w-full block'}>
            {name}
          </span>
        );
      },
    },
    {
      header: () => {
        return (
          <button
            className="flex space-x-2 items-center"
            onClick={() => {
              setSort('none');

              if (!sortEmail || sortEmail === 'asc') {
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
      cell: ({ row }) => {
        const email = row.original.email ? row.original.email : 'Anonymous';

        return (
          <span title={email} className={'truncate max-w-full block'}>
            {email}
          </span>
        );
      },
    },
    {
      header: () => {
        return (
          <button
            className="flex space-x-2 items-center"
            onClick={() => {
              setLoginSort('none');
              setSortEmail('none');
              setSort('none');
              if (createdSort === 'asc') {
                setCreatedSort('desc');
              } else {
                setCreatedSort('asc');
              }
            }}
          >
            Created At
            <Image
              src={ChevronDoubleDownIcon}
              alt="ChevronDownIcon"
              className="h-4"
            />
          </button>
        );
      },
      size: 50,
      id: 'createdAt',
      cell: ({ row }) => {
        if (row.original.created || row.original.createdAt) {
          const dateString = row.original.created ?? row.original.createdAt;
          const date = new Date(dateString) as Date;
          function formatDate(date: Date) {
            const timeString = date.toLocaleTimeString('en-US');

            const dateOptions = {
              weekday: 'short',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            } as any;
            const dateString = date.toLocaleDateString('en-US', dateOptions);

            return `${timeString} ${dateString}`;
          }

          return (
            <span className={'truncate max-w-full block'}>
              {formatDate(date)}
            </span>
          );
        }
        return '';
      },
    },
    {
      header: () => {
        return (
          <button
            className="flex space-x-2 items-center"
            onClick={() => {
              setCreatedSort('none');
              if (loginSort === 'asc') {
                setLoginSort('desc');
              } else {
                setLoginSort('asc');
              }
            }}
          >
            Last Login
            <Image
              src={ChevronDoubleDownIcon}
              alt="ChevronDownIcon"
              className="h-4"
            />
          </button>
        );
      },
      size: 50,
      id: 'lastLogin',
      cell: ({ row }) => {
        if (row.original.lastLoginAt) {
          const date = new Date(row.original.lastLoginAt);

          function formatDate(date: Date) {
            const timeString = date.toLocaleTimeString('en-US');

            const dateOptions = {
              weekday: 'short',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            } as any;
            const dateString = date.toLocaleDateString('en-US', dateOptions);

            return `${timeString} ${dateString}`;
          }

          return (
            <span className={'truncate max-w-full block'}>
              {formatDate(date)}
            </span>
          );
        }
        return '';
      },
    },
    {
      header: () => {
        return (
          <div className="bg-[#F4F4F5] w-max px-3 py-2 rounded-md flex space-x-2 items-center">
            <p> Status</p>

            <Image src={arrowUp} alt="arrowUp" className="h-4" />
          </div>
        );
      },
      id: 'status',
      cell: ({ row }) => {
        const { disabled } = row.original;
        const label = disabled ? 'Banned' : 'Active';

        return (
          <div className={'inline-flex w-full justify-center'}>
            <div
              className={`${
                disabled ? 'bg-[#EF4444] text-white' : 'border border-[#E4E4E7]'
              } py-0.5 px-2.5 text-xs font-semibold rounded-md`}
            >
              {label}
            </div>
          </div>
        );
      },
    },
    {
      header: '',
      id: 'actions',
      cell: ({ row }) => {
        const user = row.original;

        const displayName =
          (row.original.name && row.original.lastName
            ? row.original.name + ' ' + row.original.lastName
            : row.original.fullName) || row.original.displayName;

        const email = user.email as string;

        return (
          <div className={'flex justify-end'}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <IconButton>
                  <span className="sr-only">Open menu</span>
                  <EllipsisHorizontalIcon className="h-4 w-4" />
                </IconButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <If condition={!user.disabled}>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <ImpersonateUserModal
                      userId={user.id}
                      displayName={displayName as string}
                      setLoadingImpersonate={setLoadingImpersonate}
                    >
                      Impersonate
                    </ImpersonateUserModal>
                  </DropdownMenuItem>

                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <DisableUserModal
                      userId={user.id}
                      displayName={displayName as string}
                      email={email}
                    >
                      <span>Ban User</span>
                    </DisableUserModal>
                  </DropdownMenuItem>
                </If>

                <If condition={user.disabled}>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <ReactivateUserModal
                      userId={user.id}
                      displayName={displayName as string}
                      email={email}
                    >
                      Activate
                    </ReactivateUserModal>
                  </DropdownMenuItem>
                </If>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <div className="my-auto">
                    <Link href={`/admin/users/${user.id}`}>Details</Link>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="md:flex justify-between space-y-2 md:space-y-0 space-x-2 h-auto items-center">
        <div className="md:flex space-y-6 md:space-y-0 md:space-x-6">
          <input
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-md p-3 h-full text-sm text-[#71717A] shadow-sm "
            placeholder="Search name"
          ></input>
          <input
            onChange={(e) => setSearchEmail(e.target.value)}
            className="border rounded-md p-3 h-full text-sm text-[#71717A] shadow-sm "
            placeholder="Search email"
          ></input>
          <input
            onChange={(e) => setSearchId(e.target.value)}
            className="border rounded-md p-3 h-full text-sm text-[#71717A] shadow-sm "
            placeholder="Search id"
          ></input>
        </div>

        <div className="flex space-x-2">
          <Image className="w-4" src={usersIcon} alt="teams"></Image>
          <p className="my-auto font-medium text-sm">{totalUsers} Members</p>
        </div>
      </div>
      <div className="md:flex space-y-2 md:space-y-0 md:space-x-2">
        <div className="flex space-x-2 items-center  flex-wrap  text-zinc-400 bg-zinc-100 rounded-lg p-1 ">
          <DatePickerRange
            value={dateRange}
            handleValueChange={handleValueChange}
          />
        </div>
        <div className="flex items-center overflow-x-hidden flex-wrap  text-zinc-400 bg-zinc-100 rounded-lg p-1 ">
          <button
            onClick={() => setActiveSelectedTab(0)}
            className={`flex space-x-2.5 py-1 px-3 rounded-sm ${
              activeSelectedTab === 0 ? 'bg-white text-black' : ''
            } hover:bg-zinc-50 hover:text-zinc-500 transition cursor-pointer disabled:hover:bg-transparent`}
          >
            All
          </button>
          <button
            onClick={() => setActiveSelectedTab(1)}
            className={`flex space-x-2.5 py-1 px-3 rounded-sm ${
              activeSelectedTab === 1 ? 'bg-white text-black' : ''
            } hover:bg-zinc-50 hover:text-zinc-500 transition cursor-pointer disabled:hover:bg-transparent`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveSelectedTab(2)}
            className={`flex space-x-2.5 py-1 px-3 rounded-sm ${
              activeSelectedTab === 2 ? 'bg-white text-black' : ''
            } hover:bg-zinc-50 hover:text-zinc-500 transition cursor-pointer disabled:hover:bg-transparent`}
          >
            Inactive
          </button>
        </div>
      </div>
      <div
        className={
          'flex flex-col space-y-4 md:w-[1100px] tv:w-full overflow-x-auto'
        }
      >
        <div
          style={{ width: '-webkit-fill-available' }}
          className="w-auto m-auto md:m-0 md:w-fit border border-[#E4E4E7] rounded-md overflow-x-auto"
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="border-b border-[#E4E4E7]">
              <tr>
                {columns.map((column: any) => (
                  <th
                    key={column.id}
                    scope="col"
                    className="h-12 px-4 text-left text-[#71717A]  text-sm align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0"
                  >
                    {typeof column.header === 'function'
                      ? column.header()
                      : column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usersFilter.map((user) => (
                <tr key={user.document.id}>
                  {columns.map((column: any) => (
                    <td
                      key={column.id}
                      className="px-6 py-4 whitespace-nowrap text-sm text-black"
                    >
                      {typeof column.cell === 'function'
                        ? column.cell({ row: { original: user.document } })
                        : user.document[column.id]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={'flex justify-end space-x-2.5'}>
          <PaginationController
            rowsPerPage={rowsPerPage}
            setRowsPerPage={setRowsPerPage}
            totalPages={totalPages}
            currentPage={currentPage}
            refetch={handleResultsPage}
            hasLimit={250}
          />
        </div>
      </div>
    </div>
  );
}

export default UsersTable;
