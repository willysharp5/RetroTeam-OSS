import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import logger from '~/core/logger';

import {
  acceptInviteToOrganizationTeam,
  getOrganizationMembers,
} from '~/lib/server/organizations/memberships';

import { withAuthedUser } from '~/core/middleware/with-authed-user';
import { withPipe } from '~/core/middleware/with-pipe';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';
import withCsrf from '~/core/middleware/with-csrf';

const SUPPORTED_METHODS: HttpMethod[] = ['POST', 'GET'];

interface OrganizationMember {
  id: string;
  name: string;
  lastName: string;
  email: string;
  uid: string;
}

async function membersHandler(req: NextApiRequest, res: NextApiResponse) {
  const { method, firebaseUser } = req;
  const userId = firebaseUser.uid;

  const { id: organizationId } = getQueryParamsSchema().parse(req.query);

  switch (method) {
    case 'GET': {
      logger.info(
        {
          organizationId,
        },
        `Fetching organization members...`,
      );

      const payload = { organizationId, userId };
      const data = await getOrganizationMembers(payload);

      const uidMap = new Map<string, OrganizationMember>();

      data.forEach((item) => {
        if (item && (item as OrganizationMember).id) {
          if (!uidMap.has((item as OrganizationMember).id)) {
            uidMap.set(
              (item as OrganizationMember).id,
              {} as OrganizationMember,
            );
          }
          const target = uidMap.get(
            (item as OrganizationMember).id,
          ) as OrganizationMember;
          Object.assign(target, item);
        }

        if (item && (item as OrganizationMember).uid) {
          if (!uidMap.has((item as OrganizationMember).uid)) {
            uidMap.set(
              (item as OrganizationMember).uid,
              {} as OrganizationMember,
            );
          }
          const target = uidMap.get(
            (item as OrganizationMember).uid,
          ) as OrganizationMember;
          Object.assign(target, item);
        }
      });

      const mergedData = Array.from(uidMap.values());

      return res.send(mergedData);
    }

    case 'POST': {
      await withCsrf()(req);

      const { code } = getBodySchema().parse(req.body);

      logger.info(
        {
          code,
          organizationId,
          userId,
        },
        `Adding member to team...`,
      );

      await acceptInviteToOrganizationTeam({ code, userId });

      logger.info(
        {
          code,
          organizationId,
          userId,
        },
        `Member successfully added to team`,
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
    code: z.string().min(1),
  });
}
