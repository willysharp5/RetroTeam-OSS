import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { withPipe } from '~/core/middleware/with-pipe';
import { withAuthedUser } from '~/core/middleware/with-authed-user';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';
import withCsrf from '~/core/middleware/with-csrf';
import { VoteGroup } from '~/lib/server/board/group/vote-group';

const Body = z.object({
  id: z.string(),
  organizationId: z.string(),
  retrospectiveId: z.string(),
  userId: z.string(),
  userVotes: z.number(),
});

const SUPPORTED_HTTP_METHODS: HttpMethod[] = ['POST', 'PUT'];

async function onJoinHandler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'PUT': {
      try {
        console.log('🔍 API: /api/board/vote PUT request received:', req.body);
        const body = await Body.parseAsync(req.body);
        const data = {
          id: body.id,
          organization: body.organizationId,
          retrospectiveId: body.retrospectiveId,
          userId: body.userId,
          userVotes: body.userVotes,
        };

        console.log('🔍 API: Calling VoteGroup with data:', data);
        const result = await VoteGroup(data);

        console.log('✅ API: VoteGroup result:', result);
        if (result) {
          console.log('✅ API: Sending success response');
          res.send({ success: true, data: result });
        } else {
          console.log('❌ API: Sending failure response');
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
