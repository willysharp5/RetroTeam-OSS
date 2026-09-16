import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { withPipe } from '~/core/middleware/with-pipe';
import { withAuthedUser } from '~/core/middleware/with-authed-user';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';
import withCsrf from '~/core/middleware/with-csrf';

import { createNotifications } from '~/lib/server/notifications/add-notifications';

const Body = z.object({
  category: z.string(),
  email: z.string(),
  organization: z.string(),
  retrospectiveId: z.string(),
  teamId: z.string(),
  subtitle: z.string(),
  title: z.string(),
  type: z.string(),
});

const SUPPORTED_HTTP_METHODS: HttpMethod[] = ['POST'];

async function onJoinHandler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const body = await Body.parseAsync(req.body);

    const data = {
      category: body.category,
      email: body.email,
      organization: body.organization,
      retrospectiveId: body.retrospectiveId,
      teamId: body.teamId,
      subtitle: body.subtitle,
      title: body.title,
      type: body.type,
    };

    const result = await createNotifications(data);

    if (result) {
      res.send({ success: true, data: result });
    } else {
      res.send({ success: false });
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
