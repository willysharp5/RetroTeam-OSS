import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { withPipe } from '~/core/middleware/with-pipe';
import { withAuthedUser } from '~/core/middleware/with-authed-user';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';
import withCsrf from '~/core/middleware/with-csrf';

import { v4 as uuidv4 } from 'uuid';
import { createRetrospectives } from '~/lib/server/retrospectives/add-retrospectives';

const Body = z.object({
  title: z.string(),
  name: z.string(),
  access: z.object({
    type: z.literal('public').or(z.literal('private')).or(z.literal('team')),
    details: z.object({
      userIds: z.array(z.string()),
      teamId: z.string(),
    }),
  }),
  date: z.string(),
  icebreaker: z.boolean(),
  structure: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
    }),
  ),
  organization: z.string(),
  locked: z.boolean(),
});

const SUPPORTED_HTTP_METHODS: HttpMethod[] = ['POST'];

async function onJoinHandler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const body = await Body.parseAsync(req.body);
    const id = uuidv4();

    const data = {
      id,
      title: body.title,
      name: body.name,
      access: body.access,
      date: body.date,
      icebreaker: body.icebreaker,
      structure: body.structure,
      organization: body.organization,
      locked: body.locked,
    };

    const result = await createRetrospectives(data);

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
