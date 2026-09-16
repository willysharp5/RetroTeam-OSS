import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { withPipe } from '~/core/middleware/with-pipe';
import { withAuthedUser } from '~/core/middleware/with-authed-user';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';
import withCsrf from '~/core/middleware/with-csrf';

import { updateTeamMember } from '~/lib/server/teams/update-team-member';

const Body = z.object({
  id: z.string(),
  name: z.string(),
  lastName: z.string(),
  organization: z.string(),
  currentUserId: z.string(),
});

const SUPPORTED_HTTP_METHODS: HttpMethod[] = ['PUT'];

async function onJoinHandler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const body = await Body.parseAsync(req.body);

    const data = {
      id: body.id,
      name: body.name,
      lastName: body.lastName,
      organization: body.organization,
      currentUserId: body.currentUserId,
    };

    const result = await updateTeamMember(data);

    if (result?.success === true) {
      res.send({ success: true, data: result });
    } else {
      res.send({ success: false, message: result?.message });
      console.error(result?.message);
    }
  } catch (error: any) {
    console.error(error);
    res.status(500).send({ success: false, error: error.error });
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
