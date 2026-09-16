import { getAuth, UserRecord } from 'firebase-admin/auth';

import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';

import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';

import { withAdminProps } from '~/lib/admin/props/with-admin-props';
import { getOrganizationsForUser } from '~/lib/admin/queries';
import { Organization } from '~/lib/organizations/types/organization';
import { MembershipRole } from '~/lib/organizations/types/membership-role';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/core/ui/Table';

import Heading from '~/core/ui/Heading';
import Label from '~/core/ui/Label';
import Badge from '~/core/ui/Badge';
import TextField from '~/core/ui/TextField';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/core/ui/Dropdown';

import Button from '~/core/ui/Button';
import If from '~/core/ui/If';

import AdminRouteShell from '~/components/admin/AdminRouteShell';
import AdminHeader from '~/components/admin/AdminHeader';
import DisableUserModal from '~/components/admin/users/DisableUserModal';
import ImpersonateUserModal from '~/components/admin/users/ImpersonateUserModal';
import ReactivateUserModal from '~/components/admin/users/ReactivateUserModal';
import RoleBadge from '~/components/organizations/RoleBadge';

import { useFetchUserById } from '~/lib/server/user/hook/use-fetch-user';
import { useEffect, useState } from 'react';
import PageLoadingIndicator from '~/core/ui/PageLoadingIndicator';
import PaginationController from '~/components/shared/paginationController';
import Image from 'next/image';

import ChevronDoubleDownIcon from 'public/assets/svg/caret-sort.svg';
import configuration from '~/configuration';

const DEFAULT_ROWS = 10;

function UserAdminPage({
  user,
  organizations,
}: React.PropsWithChildren<{
  user: UserRecord & {
    isDisabled: boolean;
    creationTime: string;
    lastSignInTime: string;
  };
  organizations: Array<
    WithId<
      Organization & {
        role: MembershipRole;
      }
    >
  >;
}>) {
  const displayName = user.displayName || user.phoneNumber || user.uid || '';

  const [loadingImpersonate, setLoadingImpersonate] = useState(false);

  if (loadingImpersonate) {
    return <PageLoadingIndicator>Loading...</PageLoadingIndicator>;
  }

  return (
    <AdminRouteShell>
      <Head>
        <title>{`Manage User | ${displayName}`}</title>

        <link rel="shortcut icon" href="/assets/images/favicon/favicon.ico" />
        <link rel="canonical" href={configuration.site.siteUrl} />
        <link
          rel="apple-touch-icon"
          sizes="144x144"
          href="/assets/images/favicon/apple-touch-icon.png"
        />

        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/assets/images/favicon/favicon-16x16.png"
        />

        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/assets/images/favicon/favicon-32x32.png"
        />

        <link rel="manifest" href="/assets/images/favicon/site.webmanifest" />

        <link
          rel="mask-icon"
          href="/assets/images/favicon/safari-pinned-tab.svg"
          color="#000000"
        />

        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />

        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta
          name="msapplication-config"
          content="/favicon/browserconfig.xml"
        />
        <meta name="robots" content="noindex"></meta>
      </Head>

      <AdminHeader>Manage User</AdminHeader>

      <div className={'p-3 flex flex-col flex-1'}>
        <div className={'flex flex-col space-y-6'}>
          <div className={'flex justify-between'}>
            <div>
              <UserActionsDropdown
                uid={user.uid}
                isDisabled={user.disabled}
                displayName={displayName}
                email={user.email as string}
                setLoadingImpersonate={setLoadingImpersonate}
              />
            </div>
          </div>
          <Content user={user} organizations={organizations} />
        </div>
      </div>
    </AdminRouteShell>
  );
}

export default UserAdminPage;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const adminProps = await withAdminProps(ctx);

  if ('redirect' in adminProps) {
    return adminProps;
  }

  const auth = getAuth();
  const user = await auth.getUser(ctx.query.id as string);

  const { lastSignInTime, creationTime } = user.metadata;

  const userProps = {
    uid: user.uid,
    email: user.email || '',
    phoneNumber: user.phoneNumber || '',
    displayName: user.displayName || '',
    photoURL: user.photoURL || '',
    disabled: user.disabled,
    lastSignInTime,
    creationTime,
  };

  const organizations = await getOrganizationsForUser(user.uid);

  return {
    props: {
      ...adminProps.props,
      organizations,
      user: userProps,
    },
  };
}

function UserActionsDropdown({
  uid,
  displayName,
  isDisabled,
  email,
  setLoadingImpersonate,
}: React.PropsWithChildren<{
  uid: string;
  isDisabled: boolean;
  displayName: string;
  email: string;
  setLoadingImpersonate: (loading: boolean) => void;
}>) {
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button color={'transparent'}>
          <span className={'flex space-x-2.5 items-center'}>
            <span>Manage User</span>

            <EllipsisVerticalIcon className={'w-4'} />
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <ImpersonateUserModal
            userId={uid}
            displayName={displayName}
            setLoadingImpersonate={setLoadingImpersonate}
          >
            Impersonate
          </ImpersonateUserModal>
        </DropdownMenuItem>

        <If condition={!isDisabled}>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <DisableUserModal
              email={email}
              userId={uid}
              displayName={displayName}
            >
              <span className={'text-red-500'}>Disable</span>
            </DisableUserModal>
          </DropdownMenuItem>
        </If>

        <If condition={isDisabled}>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <ReactivateUserModal
              email={email}
              userId={uid}
              displayName={displayName}
            >
              Reactivate
            </ReactivateUserModal>
          </DropdownMenuItem>
        </If>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Content({ user, organizations }: any) {
  const [organizationRowsPerPage, setOrganizationRowsPerPage] =
    useState(DEFAULT_ROWS);
  const [teamsRowsPerPage, setTeamsRowsPerPage] = useState(DEFAULT_ROWS);
  const [retrosepctivesRowsPerPage, setRetrospectivesRowsPerPage] =
    useState(DEFAULT_ROWS);

  const [organizationSearch, setOrganizationSearch] = useState('');
  const [teamSearch, setTeamSearch] = useState('');
  const [retrospectiveSearch, setRetrospectiveSearch] = useState('');
  const [retrospectiveOrganizationSearch, setOrganizationRetroSearch] =
    useState('');

  const [organizationData, setOrganizationData] = useState([]);
  const [teamData, setTeamData] = useState<any>([]);
  const [retrospectiveData, setRetrospectiveData] = useState<any>([]);

  const [sortTeamName, setSortTeamName] = useState('');
  const [sortTeamRole, setSortTeamRole] = useState('');
  const [sortTeamOrganization, setSortTeamOrganization] = useState('');

  const [sortOrganizationName, setSortOrganizationName] = useState('');
  const [sortRole, setSortRole] = useState('');

  const [sortRetrospectiveName, setSortRetrospectiveName] = useState('');
  const [sortRetrospectiveRole, setSortRetrospectiveRole] = useState('');
  const [sortRetrospectiveOrganization, setSortRetrospectiveOrganization] =
    useState('');

  const {
    data,
    organization,
    totalOrganizationsPages,
    totalOrganizations,
    currentOrganizationPage,
    fetchUserOrganization,
    teams,
    totalTeamsPages,
    totalTeams,
    currentTeamPage,
    fetchUserTeam,
    retrospectives,
    totalRetrospectivesPages,
    totalRetrospectives,
    currentRetrospectivePage,
    fetchUserRetrospectives,
  } = useFetchUserById(
    user.uid,
    organizations,
    organizationRowsPerPage,
    teamsRowsPerPage,
    retrosepctivesRowsPerPage,
  );

  useEffect(() => {
    if (organization) {
      setOrganizationData(organization);
    }
  }, [organization]);

  useEffect(() => {
    if (teams) {
      setTeamData(teams);
    }
  }, [teams]);

  useEffect(() => {
    if (retrospectives) {
      setRetrospectiveData(retrospectives);
    }
  }, [retrospectives]);

  useEffect(() => {
    if (organizationSearch !== '') {
      const filteredOrganization = organization.filter((item: any) =>
        item.name.toLowerCase().includes(organizationSearch.toLowerCase()),
      );
      setOrganizationData(filteredOrganization);
    } else {
      if (organization) {
        setOrganizationData(organization);
      }
    }
  }, [organizationSearch, organization]);

  useEffect(() => {
    if (teamSearch !== '') {
      const filteredTeams = teams.filter((item: any) =>
        item.name.toLowerCase().includes(teamSearch.toLowerCase()),
      );
      setTeamData(filteredTeams);
    } else {
      if (teams) {
        setTeamData(teams);
      }
    }
  }, [teamSearch, teams]);

  useEffect(() => {
    const searchRetrospectives = () => {
      if (
        retrospectiveSearch !== '' ||
        retrospectiveOrganizationSearch !== ''
      ) {
        const searchQuery = retrospectiveSearch.toLowerCase();
        const organizationQuery = retrospectiveOrganizationSearch.toLowerCase();
        const filteredRetrospectives = retrospectives.filter((item: any) => {
          const nameMatches =
            retrospectiveSearch === '' ||
            item.name.toLowerCase().includes(searchQuery);
          const organizationMatches =
            retrospectiveOrganizationSearch === '' ||
            item.organizationName.toLowerCase().includes(organizationQuery);
          return nameMatches && organizationMatches;
        });

        setRetrospectiveData(
          filteredRetrospectives.length > 0 ? filteredRetrospectives : [],
        );
      } else {
        setRetrospectiveData(retrospectives);
      }
    };

    searchRetrospectives();
  }, [retrospectiveSearch, retrospectiveOrganizationSearch, retrospectives]);

  useEffect(() => {
    let sortedData = [...organizationData];

    if (sortOrganizationName !== '') {
      sortedData = sortedData.sort((a: any, b: any) => {
        if (sortOrganizationName === 'asc') {
          return a.name.localeCompare(b.name);
        } else {
          return b.name.localeCompare(a.name);
        }
      });
    }

    if (sortRole !== '') {
      sortedData = sortedData.sort((a: any, b: any) => {
        if (sortRole === 'asc') {
          return a.role - b.role;
        } else {
          return b.role - a.role;
        }
      });
    }

    setOrganizationData(sortedData);
  }, [sortOrganizationName, sortRole]);

  useEffect(() => {
    let sortedData = [...teamData];

    if (sortTeamOrganization !== '') {
      sortedData = sortedData.sort((a: any, b: any) => {
        if (sortTeamOrganization === 'asc') {
          return a.organizationName.localeCompare(b.organizationName);
        } else {
          return b.organizationName.localeCompare(a.organizationName);
        }
      });
    }

    if (sortTeamRole !== '') {
      sortedData = sortedData.sort((a: any, b: any) => {
        if (sortTeamRole === 'asc') {
          return a.role - b.role;
        } else {
          return b.role - a.role;
        }
      });
    }
    if (sortTeamName !== '') {
      sortedData = sortedData.sort((a: any, b: any) => {
        if (sortTeamName === 'asc') {
          return a.name.localeCompare(b.name);
        } else {
          return b.name.localeCompare(a.name);
        }
      });
    }

    setTeamData(sortedData);
  }, [sortTeamName, sortTeamRole, sortTeamOrganization]);

  useEffect(() => {
    let sortedData = [...retrospectiveData];

    if (sortRetrospectiveOrganization !== '') {
      sortedData = sortedData.sort((a: any, b: any) => {
        if (sortRetrospectiveOrganization === 'asc') {
          return a.organizationName.localeCompare(b.organizationName);
        } else {
          return b.organizationName.localeCompare(a.organizationName);
        }
      });
    }

    if (sortRetrospectiveRole !== '') {
      sortedData = sortedData.sort((a: any, b: any) => {
        if (sortRetrospectiveRole === 'asc') {
          return a.role - b.role;
        } else {
          return b.role - a.role;
        }
      });
    }
    if (sortRetrospectiveName !== '') {
      sortedData = sortedData.sort((a: any, b: any) => {
        if (sortRetrospectiveName === 'asc') {
          return a.name.localeCompare(b.name);
        } else {
          return b.name.localeCompare(a.name);
        }
      });
    }

    setRetrospectiveData(sortedData);
  }, [
    sortRetrospectiveName,
    sortRetrospectiveOrganization,
    sortRetrospectiveRole,
  ]);

  return (
    <div className="mx-6 space-y-6">
      <Heading type={4}>User Details</Heading>
      <div className={'flex space-x-2 space-y-2 items-center'}>
        <div>
          <Label>Status</Label>
        </div>

        <div className={'inline-flex'}>
          {user.disabled ? (
            <Badge size={'small'} color={'error'}>
              Disabled
            </Badge>
          ) : (
            <Badge size={'small'} color={'success'}>
              Active
            </Badge>
          )}
        </div>
      </div>
      <div className="md:flex w-full space-between">
        <div className="w-full">
          <div className="mt-2">
            <TextField.Label>
              Id
              <TextField.Input
                className={'max-w-sm'}
                defaultValue={user.uid ?? ''}
                disabled
              />
            </TextField.Label>
          </div>
          <div className="mt-2">
            <TextField.Label>
              Name
              <TextField.Input
                className={'max-w-sm'}
                defaultValue={data?.fullName ?? ''}
                disabled
              />
            </TextField.Label>
          </div>

          <div className="mt-2">
            <TextField.Label>
              Email
              <TextField.Input
                className={'max-w-sm'}
                defaultValue={user.email ?? ''}
                disabled
              />
            </TextField.Label>
          </div>
        </div>
        <div className="w-full">
          <div className="mt-2">
            <TextField.Label>
              Created at
              <TextField.Input
                className={'max-w-sm'}
                defaultValue={user.creationTime ?? ''}
                disabled
              />
            </TextField.Label>
          </div>

          <div className="mt-2">
            <TextField.Label>
              Last Login
              <TextField.Input
                className={'max-w-sm'}
                defaultValue={user.lastSignInTime ?? ''}
                disabled
              />
            </TextField.Label>
          </div>
        </div>
      </div>
      <p className="text-gray-600">
        Filters are on client side and only work for records that are shown in
        the table.
      </p>
      <div className="space-y-6">
        <Heading type={4}>Organizations</Heading>

        <input
          onChange={(e) => setOrganizationSearch(e.target.value)}
          className="border rounded-md p-3 h-full text-sm text-[#71717A] shadow-sm "
          placeholder="Search name"
        ></input>

        {organizationData && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization ID</TableHead>
                <TableHead>
                  <button
                    className="flex space-x-2 items-center"
                    onClick={() => {
                      setSortRole('');
                      if (sortOrganizationName === 'desc') {
                        setSortOrganizationName('asc');
                      } else {
                        setSortOrganizationName('desc');
                      }
                    }}
                  >
                    Organization
                    <Image
                      src={ChevronDoubleDownIcon}
                      alt="ChevronDownIcon"
                      className="h-4"
                    />
                  </button>
                </TableHead>
                <TableHead>
                  {' '}
                  <button
                    className="flex space-x-2 items-center"
                    onClick={() => {
                      setSortOrganizationName('');
                      if (sortRole === 'desc') {
                        setSortRole('asc');
                      } else {
                        setSortRole('desc');
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
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizationData.map((organization: any) => {
                return (
                  <TableRow key={organization.id}>
                    <TableCell>{organization.id}</TableCell>
                    <TableCell>{organization.name}</TableCell>

                    <TableCell>
                      <div className={'inline-flex'}>
                        <RoleBadge role={organization.role} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        <div className="mt-6">
          <PaginationController
            rowsPerPage={organizationRowsPerPage}
            setRowsPerPage={setOrganizationRowsPerPage}
            totalPages={totalOrganizationsPages}
            currentPage={currentOrganizationPage}
            refetch={fetchUserOrganization}
          />
        </div>
      </div>

      <div className="space-y-6">
        <Heading type={4}>Teams</Heading>

        <input
          onChange={(e) => setTeamSearch(e.target.value)}
          className="border rounded-md p-3 h-full text-sm text-[#71717A] shadow-sm "
          placeholder="Search name"
        ></input>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team ID</TableHead>
              <TableHead>
                {' '}
                <button
                  className="flex space-x-2 items-center"
                  onClick={() => {
                    setSortTeamOrganization('');
                    setSortTeamRole('');
                    if (sortTeamName === 'desc') {
                      setSortTeamName('asc');
                    } else {
                      setSortTeamName('desc');
                    }
                  }}
                >
                  Team
                  <Image
                    src={ChevronDoubleDownIcon}
                    alt="ChevronDownIcon"
                    className="h-4"
                  />
                </button>
              </TableHead>
              <TableHead>
                {' '}
                <button
                  className="flex space-x-2 items-center"
                  onClick={() => {
                    setSortTeamName('');
                    setSortTeamRole('');
                    if (sortTeamOrganization === 'desc') {
                      setSortTeamOrganization('asc');
                    } else {
                      setSortTeamOrganization('desc');
                    }
                  }}
                >
                  Organization
                  <Image
                    src={ChevronDoubleDownIcon}
                    alt="ChevronDownIcon"
                    className="h-4"
                  />
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamData.map((team: any) => {
              return (
                <TableRow key={team.id}>
                  <TableCell>{team.id}</TableCell>
                  <TableCell>{team.name}</TableCell>
                  <TableCell>{team.organizationName}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <PaginationController
          rowsPerPage={teamsRowsPerPage}
          setRowsPerPage={setTeamsRowsPerPage}
          totalPages={totalTeamsPages}
          currentPage={currentTeamPage}
          refetch={fetchUserTeam}
        />
      </div>

      <div className="space-y-6">
        <Heading type={4}>Retrospective Boards</Heading>

        <div className="md:flex justify-start md:space-x-6 space-y-6 md:space-y-0">
          <input
            onChange={(e) => setRetrospectiveSearch(e.target.value)}
            className="border rounded-md p-3 h-full text-sm text-[#71717A] shadow-sm "
            placeholder="Search Retrospective name"
          ></input>

          <input
            onChange={(e) => setOrganizationRetroSearch(e.target.value)}
            className="border rounded-md p-3 h-full text-sm text-[#71717A] shadow-sm "
            placeholder="Search Organization name"
          ></input>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Retrospective ID</TableHead>
              <TableHead>
                {' '}
                <button
                  className="flex space-x-2 items-center"
                  onClick={() => {
                    setSortRetrospectiveOrganization('');
                    setSortRetrospectiveRole('');
                    if (sortRetrospectiveName === 'desc') {
                      setSortRetrospectiveName('asc');
                    } else {
                      setSortRetrospectiveName('desc');
                    }
                  }}
                >
                  Retrospective
                  <Image
                    src={ChevronDoubleDownIcon}
                    alt="ChevronDownIcon"
                    className="h-4"
                  />
                </button>
              </TableHead>
              <TableHead>
                {' '}
                <button
                  className="flex space-x-2 items-center"
                  onClick={() => {
                    setSortRetrospectiveName('');
                    setSortRetrospectiveRole('');
                    if (sortRetrospectiveOrganization === 'desc') {
                      setSortRetrospectiveOrganization('asc');
                    } else {
                      setSortRetrospectiveOrganization('desc');
                    }
                  }}
                >
                  Organization
                  <Image
                    src={ChevronDoubleDownIcon}
                    alt="ChevronDownIcon"
                    className="h-4"
                  />
                </button>
              </TableHead>
              <TableHead>
                {' '}
                <button
                  className="flex space-x-2 items-center"
                  onClick={() => {
                    setSortRetrospectiveName('');
                    setSortRetrospectiveOrganization('');
                    if (sortRetrospectiveRole === 'desc') {
                      setSortRetrospectiveRole('asc');
                    } else {
                      setSortRetrospectiveRole('desc');
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
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {retrospectiveData.map((retrospective: any) => {
              return (
                <TableRow key={retrospective.id}>
                  <TableCell>{retrospective.id}</TableCell>
                  <TableCell>{retrospective.name}</TableCell>
                  <TableCell>{retrospective.organizationName}</TableCell>
                  <TableCell>
                    <div className={'inline-flex'}>
                      <RoleBadge role={retrospective.members[user.uid].role} />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <PaginationController
          rowsPerPage={retrosepctivesRowsPerPage}
          setRowsPerPage={setRetrospectivesRowsPerPage}
          totalPages={totalRetrospectivesPages}
          currentPage={currentRetrospectivePage}
          refetch={fetchUserRetrospectives}
        />
      </div>
    </div>
  );
}
