import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { withPipe } from '~/core/middleware/with-pipe';
import { withAuthedUser } from '~/core/middleware/with-authed-user';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';
import withCsrf from '~/core/middleware/with-csrf';
import { v4 as uuidv4 } from 'uuid';
import { createComments } from '~/lib/server/board/add-comments';

const Body = z.object({
  description: z.string(),
  assignee: z.string(),
  status: z.string(),
  order: z.number(),
  retrospectiveId: z.string(),
  organization: z.string(),
  teamId: z.string(),
  id: z.string().optional(),
  author: z.string().optional(),
  group: z.string(),
  votes: z.number().optional(),
  deleteVotes: z.boolean().optional(),
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
      status: body.status,
      order: body.order,
      organization: body.organization,
      team: body.teamId,
      retrospectiveId: body.retrospectiveId,
      author: body.author,
      group: body.group,
    };

    const result = await createComments(data);

    if (result) {
      res.send({ success: true, data: result });
    } else {
      res.send({ success: false });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ success: false, error: 'Internal Server Error' + error });
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
