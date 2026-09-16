import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { withPipe } from '~/core/middleware/with-pipe';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';
import withCsrf from '~/core/middleware/with-csrf';
import { createUser } from '~/lib/server/user/add-user';

const Body = z.object({
  name: z.string(),
  lastName: z.string(),
  email: z.string(),
  userId: z.string(),
});

const SUPPORTED_HTTP_METHODS: HttpMethod[] = ['POST'];

async function onJoinHandler(req: NextApiRequest, res: NextApiResponse) {
  const body = Body.parse(req.body);

  try {
    const result = await createUser({
      userId: body.userId,
      name: body.name,
      lastName: body.lastName,
      email: body.email,
    });

    if (result === 'success') {
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ success: false });
  } catch (err) {
    return res.status(500).json({ success: false, message: (err as Error).message });
  }
}


export default function completeOnJoinHandler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const handler = withPipe(
    withCsrf(),
    withMethodsGuard(SUPPORTED_HTTP_METHODS),
    onJoinHandler,
  );

  return withExceptionFilter(req, res)(handler);
}
