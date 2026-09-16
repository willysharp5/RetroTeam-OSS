import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import logger from '~/core/logger';
import { withAuthedUser } from '~/core/middleware/with-authed-user';
import { withPipe } from '~/core/middleware/with-pipe';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';
import withCsrf from '~/core/middleware/with-csrf';
import { acceptRequest, denyBoardAccess } from '~/lib/server/board/memberships';

const SUPPORTED_METHODS: HttpMethod[] = ['POST', 'GET'];

async function membersHandler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  const { id: organizationId } = getQueryParamsSchema().parse(req.query);

  switch (method) {
    case 'POST': {
      await withCsrf()(req);

      const { userId, teamId, retrospectiveId, accept } = getBodySchema().parse(
        req.body,
      );

      logger.info(
        {
          organizationId,
          userId,
          retrospectiveId,
        },
        `Adding member to board...(Accepted by facilitator)`,
      );
      if (accept)
        await acceptRequest({
          userId,
          teamId,
          retrospectiveId,
          organizationId,
        });
      else await denyBoardAccess({ userId, retrospectiveId, organizationId });

      logger.info(
        {
          organizationId,
          userId,
          retrospectiveId,
        },
        `Member successfully added to board`,
      );

      return res.send({ success: true });
    }
  }
}

export default function members(req: NextApiRequest, res: NextApiResponse) {
  const handler = withPipe(
    withMethodsGuard(SUPPORTED_METHODS),
    withAuthedUser,
    membersHandler,
  );

  return withExceptionFilter(req, res)(handler);
}

function getQueryParamsSchema() {
  return z.object({
    id: z.string().min(1),
  });
}

function getBodySchema() {
  return z.object({
    accept: z.boolean(),
    userId: z.string(),
    teamId: z.string(),
    retrospectiveId: z.string(),
  });
}
