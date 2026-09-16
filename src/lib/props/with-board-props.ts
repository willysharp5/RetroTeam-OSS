import { GetServerSidePropsContext } from 'next';
import { setCookie, parseCookies } from 'nookies';

import configuration from '~/configuration';
import { getUserInfoById } from '~/core/firebase/admin/auth/get-user-info-by-id';
import { getLoggedInUser } from '~/core/firebase/admin/auth/get-logged-in-user';
import { initializeFirebaseAdminApp } from '~/core/firebase/admin/initialize-firebase-admin-app';

import { getCurrentOrganization } from '~/lib/server/organizations/get-current-organization';
import { withTranslationProps } from '~/lib/props/with-translation-props';
import { getUserData } from '~/lib/server/queries';

import createCsrfCookie from '~/core/generic/create-csrf-token';
import { getCurrentTeam } from '../server/teams/get-current-team';
import getBoardById from '../server/board/get-board-by-id';

const ORGANIZATION_ID_COOKIE_NAME = 'organizationId';
const TEAM_ID_COOKIE_NAME = 'teamId';

const DEFAULT_OPTIONS = {
  redirectPath: configuration.paths.signIn,
  locale: configuration.site.locale ?? 'en',
  localeNamespaces: <string[]>[],
};

/**
 * @description A server props pipe to fetch the selected board
 * @param ctx
 * @param options
 */
export async function withBoardProps(
  ctx: GetServerSidePropsContext,
  options: Partial<typeof DEFAULT_OPTIONS> = DEFAULT_OPTIONS,
) {
  // Auth & metadata
  const mergedOptions = getAppPropsOptions(ctx.locale, options);
  const { redirectPath } = mergedOptions;

  try {
    // Initialize Firebase
    await initializeFirebaseAdminApp();
    
    const metadata = await getUserAuthMetadata(ctx);
    if (!metadata) {
      return redirectToLogin({ returnUrl: ctx.resolvedUrl, redirectPath, signOut: true });
    }

    const { uid: userId } = metadata;

    const csrfTokenPromise = createCsrfCookie(ctx);
    const translationPromise = withTranslationProps(mergedOptions);
    const uiPropsPromise = Promise.resolve(getUiProps(ctx));

    // Fetch remaining data in parallel
    const [csrfToken, translationResult, uiProps, board] = await Promise.all([
      csrfTokenPromise,
      translationPromise,
      uiPropsPromise,
      getBoardById(ctx.params?.id as string),
    ]);

    // Fetch user & organization in parallel
    const [user, organization] = await Promise.all([
      getUserData(userId),
      getCurrentOrganization(userId, board.organizationId),
    ]);

    if (!user || !organization) {
      return redirectToOnboarding();
    }

    if (!board) {
      return redirectTo404ErrorPage();
    }

    const isMember = Boolean(board.members[userId]);
    if (!isMember) {
      return redirectToBoardForm(board.id, board.organizationId);
    }
    if (!board.members[userId].active) {
      return redirectToRemovedBoard(board.id, board.organizationId);
    }

    // Save cookies
    saveOrganizationInCookies(ctx, organization.id);
    const currentOrgId = ctx.req.cookies[ORGANIZATION_ID_COOKIE_NAME];
    let team;
    if (currentOrgId !== organization.id) {
      team = await getCurrentTeam(userId, organization.id, undefined) as any;
    } else {
      const currentTeamId = ctx.req.cookies[TEAM_ID_COOKIE_NAME];
      team = await getCurrentTeam(userId, organization.id, currentTeamId) as any;
    }
    if (team) saveTeamInCookies(ctx, team.id);
    return {
      props: {
        session: metadata,
        user,
        organization,
        team: team ? { id: team.id, name: team.name } : {},
        csrfToken,
        ui: uiProps,
        ...translationResult.props,
      },
    };
  } catch (e) {
    const id = ctx.params?.id as string;

    if (!id) return redirectTo404ErrorPage();

    const board = await getBoardById(id);
    if (!board) return redirectTo404ErrorPage();

    return redirectToBoardForm(id, board.organization);
  }

}


/**
 * @name redirectToLogin
 */
function redirectToLogin({
  returnUrl,
  redirectPath,
  needsEmailVerification,
  signOut,
}: {
  returnUrl: string;
  redirectPath: string;
  needsEmailVerification?: boolean;
  signOut: boolean;
}) {
  const cleanReturnUrl = getPathFromReturnUrl(returnUrl);

  const params: StringObject = {
    returnUrl: cleanReturnUrl ?? '/',
  };

  if (needsEmailVerification) {
    params.needsEmailVerification = 'true';
  }

  if (signOut) {
    params.signOut = 'true';
  }

  const queryParams = new URLSearchParams(params);

  // we build the sign in URL
  // appending the "returnUrl" query parameter so that we can redirect the user
  // straight to where they were headed and the "signOut" parameter
  // to force the client to sign the user out from the client SDK
  const destination = `${redirectPath}?${queryParams}`;

  return {
    redirect: {
      permanent: false,
      destination,
    },
  };
}

async function getUserAuthMetadata(ctx: GetServerSidePropsContext) {
  const user = await getLoggedInUser(ctx);

  return getUserInfoById(user.uid);
}

function saveOrganizationInCookies(
  ctx: GetServerSidePropsContext,
  organizationId: string,
) {
  const expiresIn = ctx.req.cookies['sessionExpiresAt'];
  const secure = process.env.NEXT_PUBLIC_EMULATOR !== 'true';
  const maxAge = expiresIn ? parseInt(expiresIn, 10) : undefined;

  setCookie(ctx, ORGANIZATION_ID_COOKIE_NAME, organizationId, {
    maxAge,
    httpOnly: true,
    secure,
    path: '/',
    sameSite: 'lax',
  });
}

function saveTeamInCookies(ctx: GetServerSidePropsContext, teamId: string) {
  const expiresIn = ctx.req.cookies['sessionExpiresAt'];
  const secure = process.env.NEXT_PUBLIC_EMULATOR !== 'true';
  const maxAge = expiresIn ? parseInt(expiresIn, 10) : undefined;

  setCookie(ctx, TEAM_ID_COOKIE_NAME, teamId, {
    maxAge,
    httpOnly: true,
    secure,
    path: '/',
    sameSite: 'lax',
  });
}

/**
 * @name redirectToOnboarding
 */
function redirectToOnboarding() {
  const destination = configuration.paths.onboarding;

  return {
    redirect: {
      permanent: false,
      destination,
    },
  };
}

/**
 * @name redirectToBoardForm
 */
function redirectToBoardForm(id: string, organizationId: string) {
  const destination = `/board/${id}/auth?organizationId=${organizationId}`;

  return {
    redirect: {
      permanent: false,
      destination,
    },
  };
}

/**
 * @name redirectTo404ErrorPage
 */
function redirectTo404ErrorPage() {
  const destination = `/404`;

  return {
    redirect: {
      permanent: false,
      destination,
    },
  };
}

/**
 * @name redirectToRemovedBoard
 */
function redirectToRemovedBoard(id: string, organizationId: string) {
  const destination = `/board/${id}/removed?organization=${organizationId}`;

  return {
    redirect: {
      permanent: false,
      destination,
    },
  };
}

function getAppPropsOptions(
  locale: string | undefined,
  options: Partial<typeof DEFAULT_OPTIONS>,
) {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  return {
    ...mergedOptions,
    locale: locale ?? mergedOptions.locale,
  };
}

function getUiProps(ctx: GetServerSidePropsContext) {
  const cookies = parseCookies(ctx);
  const sidebarState = cookies['sidebarState'] ?? 'expanded';
  const theme = cookies['theme'] ?? 'light';

  return {
    sidebarState,
    theme,
  };
}

function getPathFromReturnUrl(returnUrl: string) {
  try {
    return new URL(returnUrl).pathname;
  } catch (e) {
    return returnUrl.split('?')[0];
  }
}
