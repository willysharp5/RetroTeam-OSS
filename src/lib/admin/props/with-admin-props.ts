import { GetServerSidePropsContext } from 'next';

import { withAdmin as withFirebaseAdmin } from '~/core/middleware/with-admin';
import { withTranslationProps } from '~/lib/props/with-translation-props';
import { isSuperAdmin } from '~/lib/admin/utils/is-super-admin';
import createCsrfCookie from '~/core/generic/create-csrf-token';
import { getLoggedInUser } from '~/core/firebase/admin/auth/get-logged-in-user';
import { getUserInfoById } from '~/core/firebase/admin/auth/get-user-info-by-id';
import configuration from '~/configuration';
import { destroyCookie, parseCookies, setCookie } from 'nookies';
import { initializeFirebaseAdminApp } from '~/core/firebase/admin/initialize-firebase-admin-app';
import { getUserData } from '~/lib/server/queries';
import { getCurrentOrganization } from '~/lib/server/organizations/get-current-organization';
import { getCurrentTeam } from '~/lib/server/teams/get-current-team';

const ORGANIZATION_ID_COOKIE_NAME = 'organizationId';
const TEAM_ID_COOKIE_NAME = 'teamId';

/**
 * @name withAdminProps
 * @description This is a middleware that checks if the user is an admin.
 * @param ctx
 */


export async function withAdminProps(
  ctx: GetServerSidePropsContext,
  options: Partial<typeof DEFAULT_OPTIONS> = DEFAULT_OPTIONS,
) {
  const mergedOptions = getAppPropsOptions(ctx.locale, options);
  const { redirectPath } = mergedOptions;

  try {
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

    const isDisabled = metadata?.disabled ?? false;

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


    const isAdmin = await isSuperAdmin(ctx).catch(() => false);

    if (!isAdmin) {
      return {
        redirect: {
          permanent: false,
          destination: '/404',
        },
      };
    }

    const currentOrganizationId = ctx.req.cookies[ORGANIZATION_ID_COOKIE_NAME];

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

    const csrfToken = await createCsrfCookie(ctx);

    const { props: translationProps } =
      await withTranslationProps(mergedOptions);

    const ui = getUiProps(ctx);
    if (team) {
      return {
        props: {
          session: metadata,
          user,
          organization,
          team: { id: team?.id, name: team?.name },
          csrfToken,
          ui,
          isDisabled,
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
          isDisabled,
          ...translationProps,
        },
      };
    }
  } catch (e) {
    clearAuthenticationCookies(ctx);
    // if the user is signed out, we save the requested URL
    // so, we can redirect them to where they originally navigated to
    return redirectToLogin({
      returnUrl: ctx.resolvedUrl,
      redirectPath,
      signOut: true,
    });
  }
}

/**
 * @name clearAuthenticationCookies
 * @description When authentication fails, we clear session cookies that may
 * be stale
 * @param ctx
 */
function clearAuthenticationCookies(ctx: GetServerSidePropsContext) {
  destroyCookie(ctx, 'session');
  destroyCookie(ctx, 'sessionExpiresAt');
}

async function getUserAuthMetadata(ctx: GetServerSidePropsContext) {
  const user = await getLoggedInUser(ctx);

  return getUserInfoById(user.uid);
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

function getPathFromReturnUrl(returnUrl: string) {
  try {
    return new URL(returnUrl).pathname;
  } catch (e) {
    return returnUrl.split('?')[0];
  }
}

const DEFAULT_OPTIONS = {
  redirectPath: configuration.paths.signIn,
  locale: configuration.site.locale ?? 'en',
  localeNamespaces: <string[]>[],
};

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
