import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { withPipe } from '~/core/middleware/with-pipe';
import { withAuthedUser } from '~/core/middleware/with-authed-user';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';
import withCsrf from '~/core/middleware/with-csrf';

import { updateActions } from '~/lib/server/actions/update-actions';
import { archiveActions } from '~/lib/server/actions/archive-actions';

const Body = z.object({
  id: z.string(),
  description: z.string(),
  assignee: z.string(),
  date: z.string(),
  organization: z.string(),
  status: z.string(),
  order: z.number(),
  teamId: z.string(),
  facilitator: z.string(),
});

const ArchiveBody = z.object({
  id: z.string(),
  organization: z.string(),
  archive: z.boolean(),
  teamId: z.string(),
});

const SUPPORTED_HTTP_METHODS: HttpMethod[] = ['PUT', 'POST'];

async function onJoinHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'PUT') {
    try {
      const body = await Body.parseAsync(req.body);

      const data = {
        id: body.id,
        description: body.description,
        assignee: body.assignee,
        date: body.date,
        organization: body.organization,
        team: body.teamId,
        status: body.status,
        order: body.order,
        facilitator: body.facilitator,
      };

      const result = await updateActions(data);

      if (result) {
        res.send({ success: true, data: result });
      } else {
        res.send({ success: false });
      }
    } catch (error) {
      console.error(error);
      res.status(500).send({ success: false, error: 'Internal Server Error' });
    }
  } else if (req.method === 'POST') {
    try {
      const body = await ArchiveBody.parseAsync(req.body);

      const data = {
        id: body.id,
        organization: body.organization,
        archive: body.archive,
        team: body.teamId,
      };

      const result = await archiveActions(data);

      if (result) {
        res.send({ success: true, data: result });
      } else {
        res.send({ success: false });
      }
    } catch (error) {
      console.error(error);
      res.status(500).send({ success: false, error: error });
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
