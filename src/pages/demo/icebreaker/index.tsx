import { GetServerSidePropsContext } from 'next';
import dynamic from 'next/dynamic';
import { initializeFirebaseAdminApp } from '~/core/firebase/admin/initialize-firebase-admin-app';
import FirebaseFirestoreProvider from '~/core/firebase/components/FirebaseFirestoreProvider';
import createCsrfToken from '~/core/generic/create-csrf-token';
import logger from '~/core/logger';
import { withUserProps } from '~/lib/props/with-user-props';

const DemoIcebreakerPage = dynamic(
  () => import('~/components/demo-board/IcebreakerPage'),
  {
    ssr: false,
  },
);

const DemoIcebreaker = () => {
    
  return (
    <>
      <div id="overlay"></div>
      <div id="board">
        <FirebaseFirestoreProvider>
          <DemoIcebreakerPage/>
        </FirebaseFirestoreProvider>
      </div>
    </>
  );
};

export default DemoIcebreaker;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  // we need to create the admin app before
  // we can use Firestore on the server-side
  await initializeFirebaseAdminApp();

  const { props } = await withUserProps(ctx);
  const user = props.user;


  try {
 
    const csrfToken = await createCsrfToken(ctx);

    return {
      props: {
        ...props,
        csrfToken,
        user,
      },
    };
  } catch (e) {
    logger.debug(e);

    logger.error(
      `Error encountered while fetching invite. Redirecting to home page...`,
    );

    return {
      props: {
        ...props,
        user,
      },
    };
  }
}