import type { NextApiRequest } from 'next';
import { getUserFromSessionCookie } from './get-user-from-session-cookie';
import { throwForbiddenException } from '~/core/http-exceptions';
import logger from '~/core/logger';

/**
 * @name authMiddleware
 * @description Attaches the current Firebase User {@link DecodedIdToken} to the
 * {@link NextApiRequest} if available, otherwise returns a {@link HttpStatusCode.Forbidden} error.
 * Only use this to protect an API endpoint for signed-in users.
 * @param req
 */
export async function authMiddleware(req: NextApiRequest) {
  const session = req.cookies.session;

  if (!session) {
    return throwForbiddenException();
  }

  try {
    const user = await getUserFromSessionCookie(session);

    if (user) {
      // Attach the current Firebase user object (DecodedIdToken) to
      // NextApiRequest so that it can be used in any API handler
      req.firebaseUser = user;
    } else {
      return throwForbiddenException();
    }
  } catch (error: any) {
    logger.error(
      { err: error, session },
      'Error verifying session cookie in authMiddleware',
    );

    // If the token was revoked, throw a forbidden error immediately
    if (error.code === 'auth/session-cookie-revoked') {
      return throwForbiddenException('Session expired. Please sign in again.');
    }

    // You can also handle other specific errors here if needed

    throw error; // let the exception filter handle everything else
  }
}
