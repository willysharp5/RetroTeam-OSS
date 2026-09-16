import { GetServerSidePropsContext } from 'next';
import dynamic from 'next/dynamic';
import { useRef } from 'react';

import RouteShell from '~/components/RouteShell';
import { withBoardProps } from '~/lib/props/with-board-props';

const RetrospectivesResults = dynamic(
  () => import('~/components/retrospectives/Results'),
  {
    ssr: false,
  },
);

const BoardResults = () => {
  const printRef = useRef(null);

  return (
    <>
      <div id="overlay"></div>
      <div id="results">
        <RouteShell title={'Results'}>
          <RetrospectivesResults hasHeader={true} printRef={printRef} />
        </RouteShell>
      </div>
    </>
  );
};

export default BoardResults;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  return await withBoardProps(ctx);
}
