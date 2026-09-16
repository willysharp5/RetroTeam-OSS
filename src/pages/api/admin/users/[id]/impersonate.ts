import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from 'firebase-admin/auth';
import { setCookie } from 'nookies';

import { withAdmin as withFirebaseAdmin } from '~/core/middleware/with-admin';
import { getLoggedInUser } from '~/core/firebase/admin/auth/get-logged-in-user';
import { isSuperAdmin } from '~/lib/admin/utils/is-super-admin';
import { throwUnauthorizedException } from '~/core/http-exceptions';
import withCsrf from '~/core/middleware/with-csrf';
import {
  createImpersonationRestoreToken,
  IMPERSONATION_RESTORE_COOKIE_NAME,
  IMPERSONATION_RESTORE_MAX_AGE,
} from '~/lib/server/auth/impersonation-restore-token';

export default async function impersonateUserHandler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await withFirebaseAdmin();
  await withCsrf()(req);

  const isAdmin = await isSuperAdmin({ req, res });

  if (!isAdmin) {
    return throwUnauthorizedException();
  }

  const adminUser = await getLoggedInUser({ req, res });
  const adminUid = adminUser.uid;

  const userId = req.query.id as string;
  const auth = getAuth();
  const customToken = await auth.createCustomToken(userId);

  const restoreToken = createImpersonationRestoreToken(adminUid);
  const secure = process.env.NODE_ENV === 'production';
  setCookie({ res }, IMPERSONATION_RESTORE_COOKIE_NAME, restoreToken, {
    maxAge: IMPERSONATION_RESTORE_MAX_AGE,
    httpOnly: true,
    secure,
    path: '/',
    sameSite: 'lax',
  });

  return res.json({
    customToken,
  });
}
