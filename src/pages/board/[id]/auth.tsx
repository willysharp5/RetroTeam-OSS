import { GetServerSidePropsContext } from 'next';

import { withUserProps } from '~/lib/props/with-user-props';

import logger from '~/core/logger';
import { initializeFirebaseAdminApp } from '~/core/firebase/admin/initialize-firebase-admin-app';
import createCsrfToken from '~/core/generic/create-csrf-token';
import dynamic from 'next/dynamic';
import FirebaseFirestoreProvider from '~/core/firebase/components/FirebaseFirestoreProvider';
import getBoardById from '~/lib/server/board/get-board-by-id';

const JoinBoardPage = dynamic(
  () => import('~/components/board/auth/JoinBoardPage'),
  {
    ssr: false,
  },
);

const JoinBoard = () => {
  return (
    <FirebaseFirestoreProvider>
      <JoinBoardPage />
    </FirebaseFirestoreProvider>
  );
};

export default JoinBoard;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  // we need to create the admin app before
  // we can use Firestore on the server-side
  await initializeFirebaseAdminApp();

  const { props } = await withUserProps(ctx);
  const user = props.user;
  const userId = user?.id as string;
  try {
    const id = ctx.params?.id as string;
    const csrfToken = await createCsrfToken(ctx);

    // Check if the user is part of the board
    const board = await getBoardById(id);
    const boardOrganization = board.organization;
    const isPartOfBoard = board.members[userId];

    if (isPartOfBoard) {
      return redirectToBoard(id, props, user, csrfToken, boardOrganization);
    } else {
      return {
        props: {
          ...props,
          csrfToken,
          user,
        },
      };
    }
  } catch (e) {
    logger.debug(e);

    logger.error(
      `Error encountered while joining to board. Redirecting to home page...`,
    );

    return redirectToHomePage();
  }
}
/**
 * @name redirectToBoardForm
 */
function redirectToBoard(
  id: string,
  props: any,
  user: any,
  csrfToken: any,
  boardOrganization: string,
) {
  const path = getDeepLinkPath(boardOrganization, `/board/${id}`);

  function getDeepLinkPath(organizationId: string, path: string) {
    return ['', organizationId, path.slice(1, path.length)].join('/');
  }
  const destination = path;

  return {
    props: {
      ...props,
      csrfToken,
      user,
    },
    redirect: {
      permanent: false,
      destination,
    },
  };
}

function redirectToHomePage() {
  return {
    redirect: {
      permanent: false,
      destination: '/',
    },
  };
}
