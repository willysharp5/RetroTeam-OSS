import { GetServerSidePropsContext } from 'next';
import { setCookie } from 'nookies';

import { initializeFirebaseAdminApp } from '~/core/firebase/admin/initialize-firebase-admin-app';
import { getOrganizationById, getTeamById } from '~/lib/server/queries';
import { getLoggedInUser } from '~/core/firebase/admin/auth/get-logged-in-user';

function OrganizationSplatRoute() {
  return <></>;
}

export default OrganizationSplatRoute;

/**
 * Redirects to the path with the organization id in the cookie
 * Useful to change organization or deep-link to a specific organization
 *
 * /1/dashboard will redirect to /dashboard with the organization id in the cookie
 * /4/settings/organization will redirect to /settings/organization with the organization id in the cookie
 */
export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const teamId = ctx.params?.id as string;
  const organizationId = ctx.params?.organization as string;
  const referer = ctx.req.headers.referer || ctx.req.headers['referer'];
  const parts = referer?.split('/');
  const path = parts?.pop();
  if (teamId) {
    await initializeFirebaseAdminApp();

    const user = await getLoggedInUser(ctx).catch(() => undefined);

    // if the user is not logged in, redirect to /404
    if (!user) {
      return notFound();
    }

    const organization = await getOrganizationById(organizationId);
    const team = await getTeamById(organizationId, teamId);

    // if the organization exists, we can continue
    if (team.exists && organization.exists) {
      const isUserMember = organization.data()?.members[user.uid];

      // if the user is not an organization member, redirect to /404
      if (!isUserMember) {
        return notFound();
      }
      const expiresIn = ctx.req.cookies['sessionExpiresAt'];
      const secure = process.env.NEXT_PUBLIC_EMULATOR !== 'true';
      const maxAge = expiresIn ? parseInt(expiresIn, 10) : undefined;

      setCookie(ctx, 'teamId', teamId, {
        maxAge,
        httpOnly: true,
        secure,
        path: '/',
        sameSite: 'lax',
      });
      return {
        redirect: {
          destination: path,
        },
      };
    }
  }

  // in all other cases, redirect to /404
  return notFound();
}

function notFound() {
  return {
    notFound: true,
  };
}
