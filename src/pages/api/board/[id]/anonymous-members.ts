import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import logger from '~/core/logger';

import { withPipe } from '~/core/middleware/with-pipe';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';
import withCsrf from '~/core/middleware/with-csrf';
import { acceptInviteToBoard } from '~/lib/server/board/memberships';

const SUPPORTED_METHODS: HttpMethod[] = ['POST', 'GET'];

async function membersHandler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  const {
    id: retrospectiveId,
    organizationId,
    teamId,
  } = getQueryParamsSchema().parse(req.query);

  switch (method) {
    case 'POST': {
      await withCsrf()(req);

      const { code, type, name, lastName, userId } = getBodySchema().parse(
        req.body,
      );

      logger.info(
        {
          code,
          organizationId,
          userId,
          type,
        },
        `Adding member to organization board...`,
      );

      await acceptInviteToBoard({
        code,
        userId,
        name,
        lastName,
        teamId,
        retrospectiveId,
      });

      logger.info(
        {
          code,
          organizationId,
          userId,
        },
        `Member successfully added to organization`,
      );

      return res.send({ success: true });
    }
  }
}

export default function anonymousMembers(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const handler = withPipe(withMethodsGuard(SUPPORTED_METHODS), membersHandler);

  return withExceptionFilter(req, res)(handler);
}

function getQueryParamsSchema() {
  return z.object({
    id: z.string().min(1),
    organizationId: z.string().min(1),
    teamId: z.string().min(1),
  });
}

function getBodySchema() {
  return z.object({
    code: z.string().min(1),
    type: z.string(),
    name: z.string(),
    lastName: z.string(),
    userId: z.string(),
  });
}
