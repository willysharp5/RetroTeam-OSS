import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { withPipe } from '~/core/middleware/with-pipe';
import { withAuthedUser } from '~/core/middleware/with-authed-user';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';
import withCsrf from '~/core/middleware/with-csrf';

import { v4 as uuidv4 } from 'uuid';
import { createTemplates } from '~/lib/server/templates/add-templates';

const Body = z.object({
  title: z.string(),
  summary: z.string(),
  structure: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
    }),
  ),
});

const SUPPORTED_HTTP_METHODS: HttpMethod[] = ['POST'];

async function onJoinHandler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const body = await Body.parseAsync(req.body);
    const id = uuidv4();

    const data = {
      id,
      title: body.title,
      summary: body.summary,
      structure: body.structure,
    };

    const result = await createTemplates(data);

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
