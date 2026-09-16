import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from 'firebase-admin/auth';
import { parseCookies, destroyCookie } from 'nookies';

import { withAdmin as withFirebaseAdmin } from '~/core/middleware/with-admin';
import { throwUnauthorizedException } from '~/core/http-exceptions';
import {
  verifyImpersonationRestoreToken,
  createOneTimeSessionRestoreToken,
  IMPERSONATION_RESTORE_COOKIE_NAME,
} from '~/lib/server/auth/impersonation-restore-token';
import { withPipe } from '~/core/middleware/with-pipe';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';

type HttpMethod = 'POST';
const SUPPORTED_HTTP_METHODS: HttpMethod[] = ['POST'];

/**
 * Exit impersonation does not require CSRF: authorization is the valid
 * impersonation_restore cookie (httpOnly, server-signed, short-lived).
 * The current session is the impersonated user, so session-bound CSRF
 * may be missing or mismatched; the restore cookie is sufficient.
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  await withFirebaseAdmin();

  // Read from both: Next.js may expose cookies on req.cookies; nookies reads Cookie header
  const cookieValue =
    req.cookies?.[IMPERSONATION_RESTORE_COOKIE_NAME] ??
    parseCookies({ req })[IMPERSONATION_RESTORE_COOKIE_NAME];

  const payload = cookieValue ? verifyImpersonationRestoreToken(cookieValue) : null;
  if (!payload) {
    return throwUnauthorizedException('Invalid or expired impersonation session');
  }

  const auth = getAuth();
  const customToken = await auth.createCustomToken(payload.adminUid);
  const restoreToken = createOneTimeSessionRestoreToken(payload.adminUid);

  destroyCookie({ res }, IMPERSONATION_RESTORE_COOKIE_NAME, { path: '/' });

  return res.status(200).json({ customToken, restoreToken });
}

export default function exitImpersonationHandler(req: NextApiRequest, res: NextApiResponse) {
  const wrapped = withPipe(
    withMethodsGuard(SUPPORTED_HTTP_METHODS),
    handler,
  );
  return withExceptionFilter(req, res)(wrapped);
}
