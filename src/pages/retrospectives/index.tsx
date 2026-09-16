import { GetServerSidePropsContext } from 'next';
import dynamic from 'next/dynamic';

import { withAppProps } from '~/lib/props/with-app-props';
import RouteShell from '~/components/RouteShell';

const RetrospectivePage = dynamic(
  () => import('~/components/retrospectives/RetrospectivesPage'),
  {
    ssr: false,
  },
);

const Retrospective = () => {
  return (
    <>
      <div id="overlay"></div>
      <div id="retrospective">
        <RouteShell title={'Retrospective'}>
          <RetrospectivePage />
        </RouteShell>
      </div>
    </>
  );
};

export default Retrospective;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  return await withAppProps(ctx);
}
