import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { withPipe } from '~/core/middleware/with-pipe';
import { withAuthedUser } from '~/core/middleware/with-authed-user';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';
import withCsrf from '~/core/middleware/with-csrf';
import { groupComments } from '~/lib/server/board/group-comments';
import { UpdateGroup } from '~/lib/server/board/group/update-group';

const Body = z.object({
    name: z.string(),
    id: z.string(),
    organizationId: z.string(),
    retrospectiveId: z.string(),
    comments: z.array(
        z.object({
            id: z.string(),
        })
    ).optional(),
    status: z.string(),
    order: z.number(),
    tags: z.array(
        z.object({
            id: z.string(),
            name: z.string(),
        })

    ).optional(),
    votes: z.number().optional(),
    voters: z.any().optional(),
    aiGroup: z.boolean().optional()
});

const SUPPORTED_HTTP_METHODS: HttpMethod[] = ['POST', 'PUT'];

async function onJoinHandler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'POST': {
      try {
        const body = req.body;
        const data = {
          id: body.id,
          name: body.name,
          organization: body.organizationId,
          retrospectiveId: body.retrospectiveId,
          comments: body.comments,
          status: body.status,
          votes: body.votes,
          voters: body.voters,
          tags: body.tags,
          aiGroup: body.aiGroup,
        };

        const result = await groupComments(data);

        if (result) {
          res.send({ success: true, data: result });
        } else {
          res.send({ success: false });
        }
      } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, error: 'Internal Server Error' });
      }
      break;
    }

    case 'PUT': {
      try {
        const body = await Body.parseAsync(req.body);
        const data = {
          id: body.id,
          name: body.name,
          organization: body.organizationId,
          retrospectiveId: body.retrospectiveId,
          status: body.status,
          order: body.order,
          tags: body.tags,
          aiGroup: body.aiGroup,
        };

        const result = await UpdateGroup(data);

        if (result) {
          res.send({ success: true, data: result });
        } else {
          res.send({ success: false });
        }
      } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, error: 'Internal Server Error' });
      }
      break;
    }

    default: {
      res.status(405).send({ success: false, error: 'Method Not Allowed' });
    }
  }
}


export default function completeOnJoinHandler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const handler = withPipe(
        withCsrf(),
        withMethodsGuard(SUPPORTED_HTTP_METHODS),
        withAuthedUser,
        onJoinHandler
    );

    return withExceptionFilter(req, res)(handler);
}
