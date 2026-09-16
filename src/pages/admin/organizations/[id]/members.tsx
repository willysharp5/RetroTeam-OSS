import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';

import { withAdminProps } from '~/lib/admin/props/with-admin-props';
import { getOrganizationMembersByOrganizationId } from '~/lib/admin/queries';

import OrganizationMembersTable from '~/components/admin/organizations/OrganizationMembersTable';
import AdminHeader from '~/components/admin/AdminHeader';
import AdminRouteShell from '~/components/admin/AdminRouteShell';

import configuration from '~/configuration';
import TextField from '~/core/ui/TextField';
import Heading from '~/core/ui/Heading';
import { Fragment, useEffect, useState } from 'react';
import { useFetchOrganizationById } from '~/lib/server/organizations/hooks/use-fetch-organization-id';
import { useRouter } from 'next/router';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/core/ui/Table';
import PaginationController from '~/components/shared/paginationController';
import Image from 'next/image';

import ChevronDoubleDownIcon from 'public/assets/svg/caret-sort.svg';

type Props = React.PropsWithChildren<{
  members: Awaited<ReturnType<typeof getOrganizationMembersByOrganizationId>>;
  organizationId: string;
}>;

const DEFAULT_ROWS = 10;

function AdminOrganizationMembersPage({ members, organizationId }: Props) {
  return (
    <AdminRouteShell>
      <Head>
        <title>{`Manage Members | ${configuration.site.siteName}`}</title>

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

      <AdminHeader>Manage Members</AdminHeader>

      <div className={'p-3 flex flex-col flex-1 space-y-4'}>
        <div className="mx-6 space-y-6">
          <Heading type={4}>Organization Details</Heading>
          <div className={'flex space-x-2 space-y-2 items-center'}>
            <div className={'inline-flex'}></div>
          </div>
          <Content members={members}></Content>
        </div>
      </div>
    </AdminRouteShell>
  );
}

function Content({ members }: any) {
  const router = useRouter();
  const { id } = router.query;
  const organizationId = id as string;

  const [membersRowsPerPage, setMembersRowsPerPage] = useState(DEFAULT_ROWS);
  const [teamsRowsPerPage, setTeamsRowsPerPage] = useState(DEFAULT_ROWS);

  const [searchId, setSearchId] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchName, setSearchName] = useState('');

  const [searchTeamName, setSearchTeamName] = useState('');

  const [sortTeam, setSortTeam] = useState('asc');

  const {
    data,
    fetchTeamData,
    totalTeamPages,
    teams: teamsData,
    currentTeamPage,
    members: membersServer,
    currentMembersPage,
    fetchMembersData,
    totalMembersPage,
  } = useFetchOrganizationById(
    organizationId,
    teamsRowsPerPage,
    membersRowsPerPage,
    searchTeamName,
    searchId,
    sortTeam,
  );

  const [membersData, setMembersData] = useState<any[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<any[]>([]);

  const handleSearch = () => {
    if (searchEmail != '' || searchName != '') {
      const results = filteredMembers.filter(
        (member: any) =>
          (searchEmail ? member.email.includes(searchEmail) : true) &&
          (searchName
            ? member.displayName
                .toLowerCase()
                .includes(searchName.toLowerCase())
            : true),
      );
      setMembersData(results);
    } else {
      const mergedArray = membersServer.map((member) => {
        const userData = members.find((user: any) => user.id === member.id);
        return {
          ...member,
          ...userData,
        };
      });
      setMembersData(mergedArray);
      setFilteredMembers(mergedArray);
    }
  };

  useEffect(() => {
    if (members) {
      handleSearch();
    }
  }, [searchEmail, searchName]);

  const [teams, setTeams] = useState<any[]>([]);

  useEffect(() => {
    if (teamsData) {
      setTeams(teamsData);
    }
  }, [teamsData]);

  // MEMBERS

  useEffect(() => {
    if (membersServer && members) {
      const mergedArray = membersServer.map((member) => {
        const userData = members.find((user: any) => user.id === member.id);
        return {
          ...member,
          ...userData,
        };
      });
      setMembersData(mergedArray);
      setFilteredMembers(mergedArray);
    }
  }, [membersServer, members]);
  return (
    <Fragment>
      <div className="md:flex w-full space-between">
        <div className="w-full">
          <div className="">
            <TextField.Label>
              Id
              <TextField.Input
                className={'max-w-sm'}
                defaultValue={organizationId}
                disabled
              />
            </TextField.Label>
          </div>
          <div className="mt-2">
            <TextField.Label>
              Name
              <TextField.Input
                className={'max-w-sm'}
                defaultValue={data?.name}
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
        <Heading type={4}>Members</Heading>

        <div className="md:flex space-y-6 md:space-y-0 md:space-x-6">
          <input
            onChange={(e) => setSearchId(e.target.value)}
            className="border rounded-md p-3 h-full text-sm text-[#71717A] shadow-sm "
            placeholder="Search id (server)"
          ></input>
          <input
            onChange={(e) => setSearchEmail(e.target.value)}
            className="border rounded-md p-3 h-full text-sm text-[#71717A] shadow-sm "
            placeholder="Search email"
          ></input>
          <input
            onChange={(e) => setSearchName(e.target.value)}
            className="border rounded-md p-3 h-full text-sm text-[#71717A] shadow-sm "
            placeholder="Search name"
          ></input>
        </div>

        <OrganizationMembersTable members={membersData} />
        <div className="mt-6">
          <PaginationController
            rowsPerPage={membersRowsPerPage}
            setRowsPerPage={setMembersRowsPerPage}
            totalPages={totalMembersPage}
            currentPage={currentMembersPage}
            refetch={fetchMembersData}
          />
        </div>
        <Heading type={4}>Teams</Heading>
        <input
          onChange={(e) => setSearchTeamName(e.target.value)}
          className="border rounded-md p-3 h-full text-sm text-[#71717A] shadow-sm "
          placeholder="Search name (server)"
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
                    if (sortTeam === 'asc') {
                      setSortTeam('desc');
                    } else {
                      setSortTeam('asc');
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.map((team: any) => {
              return (
                <TableRow key={team.id}>
                  <TableCell>{team.id}</TableCell>
                  <TableCell>{team.name}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <div className="mt-6">
          <PaginationController
            rowsPerPage={teamsRowsPerPage}
            setRowsPerPage={setTeamsRowsPerPage}
            totalPages={totalTeamPages}
            currentPage={currentTeamPage}
            refetch={fetchTeamData}
          />
        </div>
      </div>
    </Fragment>
  );
}

export default AdminOrganizationMembersPage;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const adminProps = await withAdminProps(ctx);

  if ('redirect' in adminProps) {
    return adminProps;
  }

  const organizationId = ctx.params?.id as string;
  const members = await getOrganizationMembersByOrganizationId(organizationId);

  return {
    props: {
      ...adminProps.props,
      members,
      organizationId,
    },
  };
}
