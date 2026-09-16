import { NextApiRequest, NextApiResponse } from 'next';

import { withPipe } from '~/core/middleware/with-pipe';
import { withAuthedUser } from '~/core/middleware/with-authed-user';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';
import withCsrf from '~/core/middleware/with-csrf';
import { getUserById } from '~/lib/server/user/get-users';
import { z } from 'zod';

const SUPPORTED_HTTP_METHODS: HttpMethod[] = ['POST'];
const Body = z.object({
  userId: z.string(),
});

async function onJoinHandler(req: NextApiRequest, res: NextApiResponse) {
  const body = await Body.parseAsync(req.body);
  const userId = body.userId;
  try {

    const result = await getUserById(userId) as any;
    
    if (result.success === true) {
      res.send({ success: true, data: result.data});
    } else {
      res.status(404).send({ success: false, error: result.message });
    }
  } catch (error: any) {
    console.error(error);
    res.status(500).send({ success: false, error: error.message });
  }
}

export default function completeOnJoinHandler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const handler = withPipe(
    withCsrf(),
    withMethodsGuard(SUPPORTED_HTTP_METHODS),
    withAuthedUser,
    onJoinHandler,
  );

  return withExceptionFilter(req, res)(handler);
}
