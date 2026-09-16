import { GetServerSidePropsContext } from 'next';
import dynamic from 'next/dynamic';

import { withAppProps } from '~/lib/props/with-app-props';
import RouteShell from '~/components/RouteShell';

const ActionsPage = dynamic(() => import('~/components/actions/ActionsPage'), {
  ssr: false,
});

const Actions = () => {
  return (
    <>
      <div id="overlay"></div>
      <div id="actions">
        <RouteShell title={'Actions'}>
          <ActionsPage />
        </RouteShell>
      </div>
    </>
  );
};

export default Actions;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  return await withAppProps(ctx);
}
