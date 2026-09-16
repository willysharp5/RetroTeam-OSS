import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import logger from '~/core/logger';

import { getTeamMembers } from '~/lib/server/organizations/memberships';

import { withAuthedUser } from '~/core/middleware/with-authed-user';
import { withPipe } from '~/core/middleware/with-pipe';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';

const SUPPORTED_METHODS: HttpMethod[] = ['POST', 'GET'];

interface OrganizationMember {
  id: string;
  name: string;
  lastName: string;
  email: string;
  uid: string;
}

async function membersHandler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  const {
    id: organizationId,
    teamId,
    userId,
  } = getQueryParamsSchema().parse(req.query);

  switch (method) {
    case 'GET': {
      logger.info(
        {
          organizationId,
          teamId,
          userId,
        },
        `Fetching organization team members...`,
      );

      const payload = { organizationId, userId, teamId };
      const data = await getTeamMembers(payload);

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
    teamId: z.string(),
    userId: z.string(),
  });
}
