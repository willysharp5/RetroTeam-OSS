import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import logger from '~/core/logger';
import admin from 'firebase-admin';
import {
  acceptInviteToOrganizationTeam,
  getOrganizationMembers,
} from '~/lib/server/organizations/memberships';

import { withPipe } from '~/core/middleware/with-pipe';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';
import withCsrf from '~/core/middleware/with-csrf';
import configuration from '~/configuration';

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
  const { userId } = getBodySchema().parse(req.body);
  const { id: organizationId } = getQueryParamsSchema().parse(req.query);
  
  if (!admin.apps.length) {
    const base64Credentials =
      configuration.firebase.googleApplicationCredentials;
    const credentials = JSON.parse(atob(base64Credentials));

    admin.initializeApp({
      credential: admin.credential.cert(credentials),
    });
  }

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

      return res.status(200).json(mergedData);
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
        `Adding member to organization team...`,
      );

      await acceptInviteToOrganizationTeam({ code, userId });

      logger.info(
        {
          code,
          organizationId,
          userId,
        },
        `Member successfully added to organization`,
      );

      return res.status(200).json({ success: true });
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
  });
}

function getBodySchema() {
  return z.object({
    code: z.string().min(1),
    userId: z.string(),
  });
}
