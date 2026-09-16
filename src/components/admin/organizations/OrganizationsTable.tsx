import { Fragment, useCallback, useEffect, useState } from 'react';

import type { ColumnDef } from '@tanstack/react-table';

import DataTable from '~/core/ui/DataTable';

import { Organization } from '~/lib/organizations/types/organization';

import Image from 'next/image';
import DatePickerRange from '~/components/shared/datepickerRange';

import schoolIcon from 'public/assets/svg/school.svg';
import ChevronDoubleDownIcon from 'public/assets/svg/caret-sort.svg';

import PaginationController from '~/components/shared/paginationController';
import LoadingMembersSpinner from '~/components/organizations/LoadingMembersSpinner';
import Link from 'next/link';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/core/ui/Dropdown';
import IconButton from '~/core/ui/IconButton';
import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import DeleteModal from '~/components/shared/deleteModal';
import toast from 'react-hot-toast';
import useDeleteOrganization from '~/lib/organizations/hooks/use-delete-organization';
import useSearchOrganizations from '~/lib/server/search/use-search-organizations';

const DEFAULT_ROWS = 10;

function OrganizationsTable() {
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');

  const [sort, setSort] = useState('none');
  const [sortTeam, setSortTeam] = useState('');
  const [sortMember, setSortMember] = useState('');

  const [totalOrganizations, setTotalOrganizations] = useState(0);

  const { trigger: searchOrganizations } = useSearchOrganizations();

  const handleResultsPage = (page: number) => {
    setCurrentPage(page);
  };

  const [dateRange, setDateRange] = useState<any>({
    startDate: undefined,
    endDate: undefined,
  });

  const [createdSort, setCreatedSort] = useState('desc');

  const onSearch = useCallback(async () => {
    setLoading(true);
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
      startDate: startDateTime,
      endDate: endDateTime,
      rowsPerPage: rowsPerPage,
      currentPage: currentPage,
      nameSort: sort,
      createdSort: createdSort,
      sortTeam: sortTeam,
      sortMember: sortMember,
    };

    searchOrganizations(body)
      .then((res: any) => {
        setCurrentPage(res.page);
        const totalPages = Math.ceil(res.found / rowsPerPage);
        setTotalPages(totalPages);
        const results = res.hits;
        setTotalOrganizations(res.found);
        setOrganizationData(results);
        setLoading(false);
      })
      .catch((e) => {
        console.error('ERROR onSearch', e);
        setLoading(false);
      });
  }, [
    search,
    rowsPerPage,
    currentPage,
    sort,
    dateRange,
    sortTeam,
    sortMember,
    createdSort,
    searchOrganizations,
  ]);

  const handleValueChange = (newValue: any) => {
    setDateRange(newValue);
  };

  const [organizationData, setOrganizationData] = useState<any>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    onSearch();
  }, [
    sortTeam,
    dateRange,
    createdSort,
    sortMember,
    totalPages,
    currentPage,
    sort,
    rowsPerPage,
    search,
  ]);

  const [selectedOrganization, setSelectedOrganization] = useState<any>();

  const { trigger: deleteOrganization } = useDeleteOrganization(
    selectedOrganization?.id as string,
  );

  async function onDeleteOrganization() {
    const promise = deleteOrganization().then((res: any) => {
      if (res.success) {
        setShowDeleteModal(false);
        setSelectedOrganization({});
        setTimeout(() => {
          onSearch();
        }, 1000);
      }
    });
    await toast.promise(promise, {
      loading: 'Deleting organization',
      success: 'Organization has been deleted',
      error: 'Error deleteing organization',
    });
  }

  const columns: Array<ColumnDef<WithId<Organization>>> = [
    {
      header: 'ID',
      accessorKey: 'id',
      cell: ({ row }: any) => {
        const id = row.original.document.id;
        const href = {
          pathname: `/admin/organizations/[id]/members`,
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
              setSortMember('none');
              setSortTeam('none');
              setCreatedSort('none');
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
      cell: ({ row }: any) => {
        const name = row.original.document.name;

        return <span>{name}</span>;
      },
      id: 'name',
    },
    {
      header: () => {
        return (
          <button
            className="flex space-x-2 items-center"
            onClick={() => {
              setSort('none');
              setSortMember('none');
              setCreatedSort('none');
              if (sortTeam === 'desc') {
                setSortTeam('asc');
              } else {
                setSortTeam('desc');
              }
            }}
          >
            Teams
            <Image
              src={ChevronDoubleDownIcon}
              alt="ChevronDownIcon"
              className="h-4"
            />
          </button>
        );
      },
      id: 'teams',
      cell: ({ row }: any) => {
        const teams = row.original?.document.teams;

        return <span>{teams}</span>;
      },
    },
    {
      header: () => {
        return (
          <button
            className="flex space-x-2 items-center"
            onClick={() => {
              setSort('none');
              setSortTeam('none');
              setCreatedSort('none');
              if (sortMember === 'desc') {
                setSortMember('asc');
              } else {
                setSortMember('desc');
              }
            }}
          >
            Members
            <Image
              src={ChevronDoubleDownIcon}
              alt="ChevronDownIcon"
              className="h-4"
            />
          </button>
        );
      },
      id: 'members',
      cell: ({ row }: any) => {
        const members = row.original.document.members;

        return (
          <span>
            {members} member{members === 1 ? '' : 's'}
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
              setSortTeam('none');
              setSortMember('none');
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
      cell: ({ row }: any) => {
        if (row.original.document.createdAt) {
          const dateString = row.original.document.createdAt;
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
      header: '',
      accessorKey: 'actions',
      cell: ({ row }: any) => {
        const id = row.original.document.id;

        return (
          <div className={''}>
            <DeleteModal
              title="WARNING!!!"
              typeMessage="html"
              message={` <p className="text-[#71717A]">Delete Organization <br/> Delete this <b>${selectedOrganization?.name}</b> organization will remove all teams, members and data from this organization. You will not be able to recover this data.</p>`}
              showModal={showDeleteModal}
              setShowModal={setShowDeleteModal}
              confirmMessage="Delete"
              cancelMessage="Cancel"
              cancelAction={() => setShowDeleteModal(false)}
              confirmAction={onDeleteOrganization}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <IconButton>
                  <span className="sr-only">Open menu</span>
                  <EllipsisHorizontalIcon className="h-4 w-4" />
                </IconButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setSelectedOrganization(row.original.document);
                    setShowDeleteModal(true);
                  }}
                >
                  <span className="flex items-center">Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <Fragment>
      <div className="md:flex justify-between space-x-2 h-auto items-center">
        <div className="md:flex md:space-x-6 space-y-6 md:space-y-0">
          <input
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-md p-3 w-full md:w-[260px] tv:w-[250px] h-full text-sm text-[#71717A] shadow-sm "
            placeholder="Search organization name"
          ></input>
          <div className="flex md:space-x-2 space-y-2 md:space-y-0 items-center  flex-wrap  text-zinc-400 bg-zinc-100 rounded-lg p-1 ">
            <DatePickerRange
              value={dateRange}
              handleValueChange={handleValueChange}
            />
          </div>
        </div>

        <div className="mt-2 md:mt-0 flex space-x-2">
          <Image className="w-4" src={schoolIcon} alt="teams"></Image>
          <p className="my-auto font-medium text-sm">
            {totalOrganizations} Organizations
          </p>
        </div>
      </div>
      {!loading ? (
        <DataTable
          data={organizationData}
          columns={columns}
          tableProps={{
            'data-cy': 'admin-users-table',
          }}
        />
      ) : (
        <div className="w-full justify-center flex">
          <LoadingMembersSpinner />
        </div>
      )}
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
    </Fragment>
  );
}

export default OrganizationsTable;
