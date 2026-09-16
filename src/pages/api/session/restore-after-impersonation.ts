import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from 'firebase-admin/auth';
import { z } from 'zod';

import logger from '~/core/logger';
import {
  throwBadRequestException,
  throwUnauthorizedException,
} from '~/core/http-exceptions';
import {
  createSessionCookie,
  getSessionCookieTTL,
  saveSessionCookie,
} from '~/lib/server/auth/save-session-cookie';
import { verifyOneTimeSessionRestoreToken } from '~/lib/server/auth/impersonation-restore-token';
import { withAdmin } from '~/core/middleware/with-admin';
import { withPipe } from '~/core/middleware/with-pipe';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';

const SUPPORTED_HTTP_METHODS: HttpMethod[] = ['POST'];

/**
 * Restore server session after exit-impersonation. Does not require CSRF;
 * authorization is the short-lived restoreToken returned by exit-impersonation.
 */
async function restoreAfterImpersonation(req: NextApiRequest, res: NextApiResponse) {
  const body = z.object({ idToken: z.string(), restoreToken: z.string() }).safeParse(req.body);
  if (!body.success) {
    return throwBadRequestException();
  }

  const { idToken, restoreToken } = body.data;
  const payload = verifyOneTimeSessionRestoreToken(restoreToken);
  if (!payload) {
    return throwUnauthorizedException('Invalid or expired restore token');
  }

  const auth = getAuth();
  let decoded: { uid: string };
  try {
    decoded = await auth.verifyIdToken(idToken);
  } catch (e) {
    logger.error(e);
    return throwUnauthorizedException('Invalid ID token');
  }

  if (decoded.uid !== payload.adminUid) {
    return throwUnauthorizedException('ID token does not match restore session');
  }

  const expiresIn = getSessionCookieTTL();
  const sessionCookie = await createSessionCookie(idToken, expiresIn);
  saveSessionCookie(res, sessionCookie, expiresIn);

  return res.status(200).json({ success: true });
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const wrapped = withPipe(
    withAdmin,
    withMethodsGuard(SUPPORTED_HTTP_METHODS),
    restoreAfterImpersonation,
  );
  return withExceptionFilter(req, res)(wrapped);
}
