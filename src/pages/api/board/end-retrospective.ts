import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import logger from '~/core/logger';

import { withAuthedUser } from '~/core/middleware/with-authed-user';

import {
  throwBadRequestException,
  throwInternalServerErrorException,
} from '~/core/http-exceptions';

import { withPipe } from '~/core/middleware/with-pipe';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';
import withCsrf from '~/core/middleware/with-csrf';
import { endRetrospective } from '~/lib/server/board/end-retrospective';

const SUPPORTED_METHODS: HttpMethod[] = ['POST'];

async function endRetrospectiveHandler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { query } = req;
  const queryParamsSchemaResult = getQueryParamsSchema().safeParse(query);

  if (!queryParamsSchemaResult.success) {
    return throwBadRequestException(queryParamsSchemaResult.error.message);
  }

  const { organizationId, teamId, retrospectiveId } =
    queryParamsSchemaResult.data;
  try {
    await endRetrospective(organizationId, retrospectiveId);

    logger.info(
      {
        organizationId,
        teamId,
        retrospectiveId,
      },
      `Finishing retrospective`,
    );

    return res.send({ success: true });
  } catch (error) {
    logger.error(
      {
        organizationId,
      },
      `Error finishing retrospective: ${error}`,
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
    endRetrospectiveHandler,
  );

  return withExceptionFilter(req, res)(handler);
}

function getQueryParamsSchema() {
  return z.object({
    organizationId: z.string().min(1),
    teamId: z.string().min(1),
    retrospectiveId: z.string(),
  });
}
