import { NextApiRequest, NextApiResponse } from 'next';

import { withPipe } from '~/core/middleware/with-pipe';
import { withAuthedUser } from '~/core/middleware/with-authed-user';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';
import withCsrf from '~/core/middleware/with-csrf';

import { deactivateAccount } from '~/lib/server/user/hook/deactivate-account';

const SUPPORTED_HTTP_METHODS: HttpMethod[] = ['DELETE'];
interface Params {
  id: string;
  organizationId: string;
}
async function onJoinHandler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const query = req.query;

    const params: Params = {
      id: query.id as string,
      organizationId: query.organizationId as string
    };

    const result = await deactivateAccount(params);
    
    if (result.success === true) {
      res.send({ success: true });
    } else {
      res.status(404).send({ success: false, error: result.message });
    }
  } catch (error: any) {
    console.error(error);
    res.status(500).send({ success: false, error: error.message });
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
