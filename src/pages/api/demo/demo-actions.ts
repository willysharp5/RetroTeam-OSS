import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { withPipe } from '~/core/middleware/with-pipe';
import { withAuthedUser } from '~/core/middleware/with-authed-user';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';
import withCsrf from '~/core/middleware/with-csrf';
import { updateAction } from '~/lib/server/board/update-actions';
import { updateDemoAction } from '~/lib/server/demo/update-demo-action';

const Body = z.object({
  description: z.string(),
  assignee: z.string(),
  date: z.any(),
  order: z.number(),
  id: z.string().optional(),
  author: z.string().optional(),
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
          author: body.author,
          date: body.date,
          status: body.status,
        };

        const result = await updateDemoAction(data);

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
