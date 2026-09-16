import { GetServerSidePropsContext } from 'next';
import dynamic from 'next/dynamic';

import { withAppProps } from '~/lib/props/with-app-props';
import RouteShell from '~/components/RouteShell';

const AnalyticsPage = dynamic(
  () => import('~/components/analytics/AnalyticsPage'),
  {
    ssr: false,
  },
);

const Analytics = () => {
  return (
    <>
      <div id="overlay"></div>
      <div id="analytics">
        <RouteShell title={'Analytics'}>
          <AnalyticsPage />
        </RouteShell>
      </div>
    </>
  );
};

export default Analytics;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  return await withAppProps(ctx);
}
