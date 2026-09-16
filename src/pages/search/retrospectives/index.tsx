import { GetServerSidePropsContext } from 'next';
import dynamic from 'next/dynamic';

import { withAppProps } from '~/lib/props/with-app-props';
import RouteShell from '~/components/RouteShell';

const RetrospectiveSearchPage = dynamic(
  () => import('~/components/search/RetrospectiveSearchPage'),
  {
    ssr: false,
  },
);

const SearchPage = () => {
  return (
    <>
      <div id="overlay"></div>
      <div id="search-retrospectives">
        <RouteShell title={'SearchRetrospectives'}>
          <RetrospectiveSearchPage />
        </RouteShell>
      </div>
    </>
  );
};

export default SearchPage;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  return await withAppProps(ctx);
}
