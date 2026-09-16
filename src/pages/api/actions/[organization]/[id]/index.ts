import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { withPipe } from '~/core/middleware/with-pipe';
import { withAuthedUser } from '~/core/middleware/with-authed-user';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';
import withCsrf from '~/core/middleware/with-csrf';

import { deleteAction } from '~/lib/server/actions/delete-actions';

const SUPPORTED_HTTP_METHODS: HttpMethod[] = ['DELETE'];
interface Params {
  id: string;
  organization: string;
  team: string;
}
async function onJoinHandler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const query = req.query;

    const params: Params = {
      id: query.id as string,
      organization: query.organization as string,
      team: query.teamId as string,
    };

    const result = await deleteAction(params);

    if (result.success === true) {
      res.send({ success: true });
    } else {
      res.status(404).send({ success: false, error: 'Action not found' });
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
