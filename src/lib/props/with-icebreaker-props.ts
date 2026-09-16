import { GetServerSidePropsContext } from 'next';

import { setCookie, parseCookies } from 'nookies';

import configuration from '~/configuration';

import { getUserInfoById } from '~/core/firebase/admin/auth/get-user-info-by-id';
import { getLoggedInUser } from '~/core/firebase/admin/auth/get-logged-in-user';
import { initializeFirebaseAdminApp } from '~/core/firebase/admin/initialize-firebase-admin-app';
import createCsrfCookie from '~/core/generic/create-csrf-token';

import { getCurrentOrganization } from '~/lib/server/organizations/get-current-organization';
import { withTranslationProps } from '~/lib/props/with-translation-props';
import { getUserData } from '~/lib/server/queries';

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
 * @description A server props pipe to fetch the selected icebreaker
 * @param ctx
 * @param options
 */
export async function withIcebreakerProps(
  ctx: GetServerSidePropsContext,
  options: Partial<typeof DEFAULT_OPTIONS> = DEFAULT_OPTIONS,
) {
  const mergedOptions = getAppPropsOptions(ctx.locale, options);
  const { redirectPath } = mergedOptions;

  try {
    const id = ctx.query?.id as string;
    await initializeFirebaseAdminApp();
    const metadata = await getUserAuthMetadata(ctx);

    // if for any reason we're not able to fetch the user's data, we redirect
    // back to the login page
    if (!metadata) {
      return redirectToLogin({
        returnUrl: ctx.resolvedUrl,
        redirectPath,
        signOut: true,
      });
    }

    const userId = metadata.uid;
    const isEmailVerified = metadata.emailVerified;
    const requireEmailVerification =
      configuration.auth.requireEmailVerification;

    // when the user is not yet verified and we require email verification
    // redirect them back to the login page
    if (!isEmailVerified && requireEmailVerification) {
      return redirectToLogin({
        returnUrl: ctx.resolvedUrl,
        redirectPath,
        needsEmailVerification: true,
        signOut: true,
      });
    }

    const isOnboarded = Boolean(metadata?.customClaims?.onboarded);

    // when the user is not yet onboarded,
    // we simply redirect them back to the onboarding flow
    if (!isOnboarded) {
      return redirectToOnboarding();
    }

    const currentOrganizationId = ctx.req.cookies[ORGANIZATION_ID_COOKIE_NAME];
    if (!currentOrganizationId) {
      return redirectToOnboarding();
    }

    const currentTeamId = ctx.req.cookies[TEAM_ID_COOKIE_NAME];

    // we fetch the user and organization records from Firestore
    // which is a separate object from the auth metadata
    const [user, organization, team] = await Promise.all([
      getUserData(userId),
      getCurrentOrganization(userId, currentOrganizationId),
      getCurrentTeam(userId, currentOrganizationId, currentTeamId),
    ]);

    // if the user wasn't found, redirect to the onboarding
    if (!user || !organization) {
      return redirectToOnboarding();
    }

    // if the organization also wasn't found, redirect to the onboarding
    // so that the user can re-start its flow and create a new organization
    if (!user) {
      return redirectToOnboarding();
    }

    // if the organization is found, save the ID in a cookie
    // so that we can fetch it on the next request
    if (organization) {
      saveOrganizationInCookies(ctx, organization.id);
    }

    if (team) {
      saveTeamInCookies(ctx, team.id);
    }

    const csrfToken = await createCsrfCookie(ctx);

    const { props: translationProps } =
      await withTranslationProps(mergedOptions);

    const ui = getUiProps(ctx);
    
    // Check if the user is part of the board
    if (id) {
      const board = await getBoardById(id);
      if (!board) {
        return redirectTo404ErrorPage();
      }
      const organizationId = board?.organizationId;
      const isPartOfBoard = board.members[userId];
      if (!isPartOfBoard) {
        return redirectToBoardForm(id, organizationId);
      }
    }

    if (team) {
      return {
        props: {
          session: metadata,
          user,
          organization,
          team: { id: team?.id, name: team?.name },
          csrfToken,
          ui,
          ...translationProps,
        },
      };
    } else {
      return {
        props: {
          session: metadata,
          user,
          organization,
          csrfToken,
          ui,
          ...translationProps,
        },
      };
    }

  } catch (e) {
    const id = ctx.query?.id as string;

    if (!id) {
      return redirectTo404ErrorPage();
    }

    const board = await getBoardById(id);

    if (!board) {
      return redirectTo404ErrorPage();
    }

    const organizationId = board.organization;

    return redirectToBoardForm(id, organizationId);
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
