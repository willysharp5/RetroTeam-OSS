import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { withPipe } from '~/core/middleware/with-pipe';
import { withAuthedUser } from '~/core/middleware/with-authed-user';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';
import withCsrf from '~/core/middleware/with-csrf';
import { updateAction } from '~/lib/server/board/update-actions';

const Body = z.object({
  description: z.string(),
  assignee: z.string(),
  date: z.any(),
  order: z.number(),
  retrospectiveId: z.string(),
  organization: z.string(),
  teamId: z.string(),
  id: z.string().optional(),
  author: z.string().optional(),
  facilitator: z.string(),
  status: z.string().optional(),
});

const SUPPORTED_HTTP_METHODS: HttpMethod[] = ['PUT'];

async function onJoinHandler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'PUT': {
      try {
        const body = await Body.parseAsync(req.body);
        const data = {
          id: body.id,
          description: body.description,
          assignee: body.assignee,
          order: body.order,
          organization: body.organization,
          team: body.teamId,
          retrospectiveId: body.retrospectiveId,
          author: body.author,
          date: body.date,
          facilitator: body.facilitator,
          status: body.status,
        };

        const result = await updateAction(data);

        if (result) {
          res.send({ success: true, data: result });
        } else {
          res.send({ success: false });
        }
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .send({ success: false, error: 'Internal Server Error' });
      }
    }
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
