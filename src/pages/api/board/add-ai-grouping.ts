import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { withPipe } from '~/core/middleware/with-pipe';
import { withAuthedUser } from '~/core/middleware/with-authed-user';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';
import withCsrf from '~/core/middleware/with-csrf';
import { createAiGrouping } from '~/lib/server/board/add-ai-grouping';

const Body = z.object({
  organization: z.string(),
  retrospectiveId: z.string()
});

const SUPPORTED_HTTP_METHODS: HttpMethod[] = ['POST'];

async function onJoinHandler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const body = await Body.parseAsync(req.body);

    const data = {
      organization: body.organization,
      retrospectiveId: body.retrospectiveId,
    };

    const result = await createAiGrouping(data);

    if (result) {
      return res.send({ success: true, data: result });
    } else {
      return res.send({ success: false });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send({ success: false, error: 'Internal Server Error' + error });
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
