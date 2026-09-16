import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';
import Image from 'next/image';

import { withAdminProps } from '~/lib/admin/props/with-admin-props';
import { getOrganizations } from '~/lib/admin/queries';

import AdminRouteShell from '~/components/admin/AdminRouteShell';
import AdminHeader from '~/components/admin/AdminHeader';
import OrganizationsTable from '~/components/admin/organizations/OrganizationsTable';
import { Organization } from '~/lib/organizations/types/organization';

import getPageFromQueryParam from '~/core/generic/get-page-query-param';
import configuration from '~/configuration';
import AdminSidebar from '~/components/admin/AdminSidebar';

import add from 'public/assets/svg/plus-circled.svg';
import { useRouter } from 'next/router';

function OrganizationsAdminPage({
  organizations,
  page,
  perPage,
  count,
}: React.PropsWithChildren<{
  organizations: Array<WithId<Organization>>;
  page: number;
  perPage: number;
  count: number;
}>) {
  const router = useRouter();
  return (
    <AdminRouteShell>
      <Head>
        <title>{`Manage Organizations | ${configuration.site.siteName}`}</title>

        <link rel="shortcut icon" href="/assets/images/favicon/favicon.ico" />

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
        <link rel="canonical" href={configuration.site.siteUrl} />
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta
          name="msapplication-config"
          content="/favicon/browserconfig.xml"
        />
        <meta name="robots" content="noindex"></meta>
      </Head>

      <AdminHeader>Organizations</AdminHeader>

      <div className={'p-3 flex  flex-1'}>
        <div className="h-full">
          <AdminSidebar />
        </div>
        <div className="md:m-6 w-full space-y-4 ">
          <div className="flex justify-between items-center">
            <div className=" space-y-4">
              <p className="text-xl font-semibold">Organizations</p>
              <p className="text-[#71717A]">All organizations for Retroteam </p>
            </div>
            <button
              onClick={() => {
                router.push('/admin/organizations/create');
              }}
              className="flex space-x-2 bg-black hover:bg-zinc-700 text-white py-2 px-4 rounded-md"
            >
              <Image className="m-auto" src={add} alt="add"></Image>
              <p> Create Organization</p>
            </button>
          </div>
          <OrganizationsTable />
        </div>
      </div>
    </AdminRouteShell>
  );
}

export default OrganizationsAdminPage;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const adminProps = await withAdminProps(ctx);

  if ('redirect' in adminProps) {
    return adminProps;
  }

  const perPage = 10;

  const query = ctx.query;
  const beforeSnapshot = query.beforeSnapshot as string;
  const afterSnapshot = query.afterSnapshot as string;
  const page = getPageFromQueryParam(query.page as string);

  const { organizations, count } = await getOrganizations({
    beforeSnapshot,
    afterSnapshot,
    perPage,
  });

  return {
    props: {
      ...adminProps.props,
      page,
      organizations,
      perPage,
      count,
    },
  };
}
