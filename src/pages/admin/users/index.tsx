import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';

import AdminRouteShell from '~/components/admin/AdminRouteShell';
import AdminHeader from '~/components/admin/AdminHeader';
import { withAdminProps } from '~/lib/admin/props/with-admin-props';
import { getUsers } from '~/lib/admin/queries';
import UsersTable from '~/components/admin/users/UsersTable';

import AdminSidebar from '~/components/admin/AdminSidebar';
import PageLoadingIndicator from '~/core/ui/PageLoadingIndicator';
import { useState } from 'react';
import configuration from '~/configuration';

function UsersAdminPage({
}: React.PropsWithChildren<{
}>) {
  const [loadingImpersonate, setLoadingImpersonate] = useState(false);

  if (loadingImpersonate) {
    return <PageLoadingIndicator>Loading...</PageLoadingIndicator>;
  }

  return (
    <AdminRouteShell>
      <Head>
        <title>{`RetroTeam | Admin`}</title>

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

      <AdminHeader>Users</AdminHeader>

      <div className={'p-3 flex  flex-1'}>
        <div className="h-full">
          <AdminSidebar />
        </div>
        <div className="md:p-6 space-y-4 overflow-auto w-screen max-w-[2100px]">
          <p className="text-xl font-semibold">Users</p>
          <p className="text-[#71717A]">All users for Retroteam </p>
          <UsersTable
            setLoadingImpersonate={setLoadingImpersonate}
          />
        </div>
      </div>
    </AdminRouteShell>
  );
}

export default UsersAdminPage;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const adminProps = await withAdminProps(ctx);

  if ('redirect' in adminProps) {
    return adminProps;
  }

  return {
    props: {
      ...adminProps.props,
    },
  };
}