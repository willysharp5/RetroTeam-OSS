import { GetServerSidePropsContext } from 'next';
import dynamic from 'next/dynamic';

import { withAppProps } from '~/lib/props/with-app-props';
import RouteShell from '~/components/RouteShell';

const CreateRetrospective = dynamic(
  () => import('~/components/retrospectives/CreateRetrospective'),
  {
    ssr: false,
  },
);

const Teams = () => {
  return (
    <>
      <div id="overlay"></div>
      <div id="teams">
        <RouteShell title={'Create new retrospective'}>
          <CreateRetrospective />
        </RouteShell>
      </div>
    </>
  );
};

export default Teams;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  return await withAppProps(ctx);
}
