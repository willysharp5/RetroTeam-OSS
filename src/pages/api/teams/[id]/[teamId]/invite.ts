import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import logger from '~/core/logger';

import { inviteMembers } from '~/lib/server/teams/invite-team-members';
import { withAuthedUser } from '~/core/middleware/with-authed-user';

import {
  throwBadRequestException,
  throwInternalServerErrorException,
} from '~/core/http-exceptions';

import { withPipe } from '~/core/middleware/with-pipe';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';
import withCsrf from '~/core/middleware/with-csrf';

const SUPPORTED_METHODS: HttpMethod[] = ['POST'];

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

  const { id: organizationId, teamId: teamId } = queryParamsSchemaResult.data;
  const invites = bodySchemaResult.data;
  const inviterId = req.firebaseUser.uid;

  try {
    await inviteMembers({
      organizationId,
      inviterId,
      invites,
      teamId,
    });

    logger.info(
      {
        organizationId,
      },
      `User invited to team`,
    );

    return res.send({ success: true });
  } catch (error) {
    logger.error(
      {
        organizationId,
        inviterId,
      },
      `Error occurred when inviting user to organization: ${error}`,
    );

    return throwInternalServerErrorException(error?.toString());
  }
}

export default function inviteHandler(
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
    teamId: z.string().min(1),
  });
}

function getBodySchema() {
  return z.array(
    z.object({
      email: z.string().email(),
      facilitator: z.string(),
    }),
  );
}
