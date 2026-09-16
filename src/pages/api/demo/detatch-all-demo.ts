import { NextApiRequest, NextApiResponse } from 'next';

import { withPipe } from '~/core/middleware/with-pipe';
import { withAuthedUser } from '~/core/middleware/with-authed-user';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';
import withCsrf from '~/core/middleware/with-csrf';

import { detachAllDemoComments } from '~/lib/server/demo/detatch-all-demo-comments';


const SUPPORTED_HTTP_METHODS: HttpMethod[] = ['DELETE'];

interface Params {
  groupId: string;
}
async function onJoinHandler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const query = req.query;

    const params: Params = {
      groupId: query.groupId as string,
    };
    const result = (await detachAllDemoComments(params)) as any;

    if (result?.success === true) {
      res.send({ success: true });
    } else {
      res.status(404).send({ success: false, error: 'Group not found' });
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
