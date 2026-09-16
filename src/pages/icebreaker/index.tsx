import { GetServerSidePropsContext } from 'next';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

import RouteShell from '~/components/RouteShell';
import { withIcebreakerProps } from '~/lib/props/with-icebreaker-props';

const IcebreakerConfigPage = dynamic(
  () => import('~/components/retrospectives/IcebreakerConfig'),
  {
    ssr: false,
  },
);

const IcebreakerConfig = () => {
  const router = useRouter();
  const { id } = router.query;
  return (
    <>
      <div id="overlay"></div>
      <div id="icebreaker">
        <RouteShell title={'Icebreaker'}>
          <IcebreakerConfigPage retrospectiveId={id as string} />
        </RouteShell>
      </div>
    </>
  );
};

export default IcebreakerConfig;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  return await withIcebreakerProps(ctx);
}
