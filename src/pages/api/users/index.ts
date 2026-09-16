import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { withPipe } from '~/core/middleware/with-pipe';
import { withAuthedUser } from '~/core/middleware/with-authed-user';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';
import withCsrf from '~/core/middleware/with-csrf';
import { createUser } from '~/lib/server/user/add-user';

const Body = z.object({
  name: z.string(),
  lastName: z.string(),
  email: z.string(),
  id: z.string().optional()
});

const SUPPORTED_HTTP_METHODS: HttpMethod[] = ['POST'];

async function onJoinHandler(req: NextApiRequest, res: NextApiResponse) {
  const body = await Body.parseAsync(req.body);
  const userId = body.id ? body.id : req.firebaseUser.uid;

  const data = {
    userId,
    name: body.name,
    lastName: body.lastName,
    email: body.email,
  };

  const result = await createUser(data);

  if (result === 'success') {
    return res.send({ success: true });
  }

  return res.send({ success: false });
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
