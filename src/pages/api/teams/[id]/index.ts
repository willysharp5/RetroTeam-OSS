import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { withPipe } from '~/core/middleware/with-pipe';
import { withAuthedUser } from '~/core/middleware/with-authed-user';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';
import withCsrf from '~/core/middleware/with-csrf';

import { updateTeam } from '~/lib/server/teams/update-team';
import { getUserFromSessionCookie } from '~/core/firebase/admin/auth/get-user-from-session-cookie';

const Body = z.object({
  id: z.string(),
  name: z.string(),
  organization: z.string(),
});

const SUPPORTED_HTTP_METHODS: HttpMethod[] = ['PUT'];

async function onJoinHandler(req: NextApiRequest, res: NextApiResponse) {
  const session = req.cookies['session'];

  const user = await getUserFromSessionCookie(session);

  try {
    const body = await Body.parseAsync(req.body);

    const data = {
      id: body.id,
      organization: body.organization,
      name: body.name,
      userId: user.uid,
    };

    const result = await updateTeam(data);

    if (result?.success === true) {
      res.send({ success: true, data: result });
    } else {
      res.send({ success: false, message: result?.message });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, error: 'Internal Server Error' });
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
