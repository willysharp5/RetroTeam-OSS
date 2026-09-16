import { GetServerSidePropsContext } from 'next';
import dynamic from 'next/dynamic';

import { withAppProps } from '~/lib/props/with-app-props';
import RouteShell from '~/components/RouteShell';

const ActionsSearchPage = dynamic(
  () => import('~/components/search/ActionsSearchPage'),
  {
    ssr: false,
  },
);

const SearchPage = () => {
  return (
    <>
      <div id="overlay"></div>
      <div id="search-actions">
        <RouteShell title={'SearchActions'}>
          <ActionsSearchPage />
        </RouteShell>
      </div>
    </>
  );
};

export default SearchPage;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  return await withAppProps(ctx);
}
