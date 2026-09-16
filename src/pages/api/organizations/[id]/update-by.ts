import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import logger from '~/core/logger';

import { MembershipRole } from '~/lib/organizations/types/membership-role';
import { inviteMembers } from '~/lib/server/organizations/invite-members';
import { withAuthedUser } from '~/core/middleware/with-authed-user';

import {
  throwBadRequestException,
  throwInternalServerErrorException,
} from '~/core/http-exceptions';

import { withPipe } from '~/core/middleware/with-pipe';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';
import withCsrf from '~/core/middleware/with-csrf';
import { updateByOrganization } from '~/lib/server/organizations/update-by';

const SUPPORTED_METHODS: HttpMethod[] = ['PUT'];

async function inviteMembersToOrganizationHandler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { query } = req;
  const queryParamsSchemaResult = getQueryParamsSchema().safeParse(query);

  if (!queryParamsSchemaResult.success) {
    return throwBadRequestException(queryParamsSchemaResult.error.message);
  }

  const bodySchemaResult = getBodySchema().safeParse(req.body);

  if (!bodySchemaResult.success) {
    return throwBadRequestException(bodySchemaResult.error.message);
  }

  const { id: organizationId } = queryParamsSchemaResult.data;
  const { userId } = bodySchemaResult.data;

  try {
    // Llamada a la función updateByOrganization
    await updateByOrganization({
      organizationId,
      userId,
    });

    logger.info(
      {
        organizationId,
      },
      `User invited to organization`,
    );

    return res.send({ success: true });
  } catch (error) {
    logger.error(
      {
        organizationId,
      },
      `Error occurred when inviting user to organization: ${error}`,
    );

    return throwInternalServerErrorException(error?.toString());
  }
}

export default function updateHandler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const handler = withPipe(
    withMethodsGuard(SUPPORTED_METHODS),
    withCsrf(),
    withAuthedUser,
    inviteMembersToOrganizationHandler,
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
    userId: z.string().min(1),
  });
}