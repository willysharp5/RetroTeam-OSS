import { NextApiRequest, NextApiResponse } from 'next';

import { withPipe } from '~/core/middleware/with-pipe';
import { withAuthedUser } from '~/core/middleware/with-authed-user';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';
import { isAIConfigured, MISSING_AI_KEY_MESSAGE } from '~/lib/server/ai/ai-config';

const SUPPORTED_HTTP_METHODS: HttpMethod[] = ['GET'];

/**
 * @name statusHandler
 * @description Reports whether an AI provider key is available, so the UI can
 * tell people to add their own key instead of silently failing. Deliberately
 * returns no part of the key itself.
 */
async function statusHandler(_: NextApiRequest, res: NextApiResponse) {
  const configured = await isAIConfigured();

  return res.json({
    configured,
    message: configured ? null : MISSING_AI_KEY_MESSAGE,
  });
}

export default function aiStatusHandler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const handler = withPipe(
    withMethodsGuard(SUPPORTED_HTTP_METHODS),
    withAuthedUser,
    statusHandler,
  );

  return withExceptionFilter(req, res)(handler);
}
