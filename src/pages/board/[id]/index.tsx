import { GetServerSidePropsContext } from 'next';
import dynamic from 'next/dynamic';

import RouteShell from '~/components/RouteShell';
import { withBoardProps } from '~/lib/props/with-board-props';

const BoardPage = dynamic(
  () => import('~/components/board/BoardPage/BoardPage'),
  {
    ssr: false,
  },
);

const Board = () => {
  return (
    <>
      <div id="overlay"></div>
      <div id="board" className='!bg-gray-100'>
        <RouteShell title={'Board'}>
          <BoardPage />
        </RouteShell>
      </div>
    </>
  );
};

export default Board;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  return await withBoardProps(ctx);
}
