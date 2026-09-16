import { NextApiRequest, NextApiResponse } from 'next';

import { withPipe } from '~/core/middleware/with-pipe';
import { withAuthedUser } from '~/core/middleware/with-authed-user';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';
import withCsrf from '~/core/middleware/with-csrf';

import { activeMemberTeam } from '~/lib/server/teams/active-member';

const SUPPORTED_HTTP_METHODS: HttpMethod[] = ['PUT'];

interface Params {
  teamId: string;
  organization: string;
  userId: string;
  removedUserName: string;
  activatedUserEmail: string;
  teamName: string;
  adminName: string;
  organizationName: string;
  currentUserId: string | undefined;
}

async function onJoinHandler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const query = req.query;

    const params: Params = {
      teamId: query.teamId as string,
      organization: query.id as string,
      userId: query.userId as string,
      removedUserName: query.removedUserName as string,
      activatedUserEmail: query.activatedUserEmail as string,
      teamName: query.teamName as string,
      adminName: query.adminName as string,
      organizationName: query.organizationName as string,
      currentUserId: query.currentUserId as string,
    };

    const result = await activeMemberTeam(params);

    if (result.success === true) {
      res.send({ success: true });
    } else {
      res.status(404).send({ success: false, error: result.message });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, error: 'Internal Server Error' });
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
