import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { withPipe } from '~/core/middleware/with-pipe';
import { withAuthedUser } from '~/core/middleware/with-authed-user';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';
import withCsrf from '~/core/middleware/with-csrf';

import { v4 as uuidv4 } from 'uuid';
import { createActions } from '~/lib/server/actions/add-actions';

const Body = z.object({
  description: z.string(),
  assignee: z.string(),
  date: z.string(),
  organization: z.string(),
  status: z.string(),
  archive: z.boolean(),
  order: z.number(),
  team: z.string(),
  author: z.string(),
});

const SUPPORTED_HTTP_METHODS: HttpMethod[] = ['POST'];

async function onJoinHandler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const body = await Body.parseAsync(req.body);
    const id = uuidv4();

    const data = {
      id,
      description: body.description,
      assignee: body.assignee,
      date: body.date,
      organization: body.organization,
      status: body.status,
      archive: false,
      order: body.order,
      team: body.team,
      author: body.author,
    };

    const result = await createActions(data);

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
