import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import logger from '~/core/logger';

import {
  acceptInviteToOrganization,
  addMemberToOrganization,
  getOrganizationMembers,
} from '~/lib/server/organizations/memberships';

import { withAuthedUser } from '~/core/middleware/with-authed-user';
import { withPipe } from '~/core/middleware/with-pipe';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';
import withCsrf from '~/core/middleware/with-csrf';

const SUPPORTED_METHODS: HttpMethod[] = ['POST', 'GET'];

async function membersHandler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
 

    case 'POST': {
      await withCsrf()(req);

      const { organizationId, userId } = getBodySchema().parse(req.body);

      logger.info(
        {
          organizationId,
          userId,
        },
        `Adding member to organization...`,
      );

      await addMemberToOrganization({ organizationId, userId });

      logger.info(
        {
          organizationId,
          userId,
        },
        `Member successfully added to organization`,
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

function getBodySchema() {
  return z.object({
    organizationId: z.string().min(1),
    userId: z.string().min(1),
  });
}
