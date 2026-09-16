import { GetServerSidePropsContext } from 'next';

import { withAdminProps } from '~/lib/admin/props/with-admin-props';
import AdminRouteShell from '~/components/admin/AdminRouteShell';
import AdminHeader from '~/components/admin/AdminHeader';
import AdminDashboard from '~/components/admin/AdminDashboard';
import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';
import { withAdmin as withFirebaseAdmin } from '~/core/middleware/with-admin';

import {
  ORGANIZATIONS_COLLECTION,
  USERS_COLLECTION,
} from '~/lib/firestore-collections';
import Head from 'next/head';
import configuration from '~/configuration';

function AdminPage(
  props: React.PropsWithChildren<{
    data: {
      usersCount: number;
      organizationsCount: number;
    };
  }>,
) {
  return (
    <>
      <AdminHeader></AdminHeader>
      <AdminRouteShell>
        <Head>
          <title>{`${configuration.site.siteName} | Admin`}</title>

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
        <div className={'p-3'}>
          <AdminDashboard data={props.data} />
        </div>
      </AdminRouteShell>
    </>
  );
}

export default AdminPage;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const adminProps = await withAdminProps(context);

  if ('redirect' in adminProps) {
    return adminProps;
  }

  const data = await loadData();

  return {
    props: {
      ...adminProps.props,
      data,
    },
  };
}

async function loadData() {
  await withFirebaseAdmin();

  const firestore = getRestFirestore();

  const organizationsResponse = await firestore
    .collection(ORGANIZATIONS_COLLECTION)
    .count()
    .get();

  const usersResponse = await firestore
    .collection(USERS_COLLECTION)
    .count()
    .get();

  const { count: organizationsCount } = organizationsResponse.data();
  const { count: usersCount } = usersResponse.data();

  return {
    usersCount,
    organizationsCount,
  };
}
