import { NextApiRequest, NextApiResponse } from 'next';
import { withPipe } from '~/core/middleware/with-pipe';
import { withAuthedUser } from '~/core/middleware/with-authed-user';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';
import withCsrf from '~/core/middleware/with-csrf';
import { z } from 'zod';
import { moveMembersFromRetrospective } from '~/lib/server/retrospectives/move-retrospective-members';
import { TeamMembers } from '~/lib/teams/types/teams';

const Body = z.object({
  organizationId: z.string(),
  teamId: z.string(),
  members: z.any(),
  activeMembers: z.any(),
  boardName: z.string(),
  facilitator: z.string(),
  teamName: z.string(),
});

const SUPPORTED_HTTP_METHODS: HttpMethod[] = ['POST'];
interface Params {
  organizationId: string;
  teamId: string;
  retrospectiveId: string;
  members: TeamMembers[] | any;
  activeMembers: TeamMembers[] | any;
  boardName: string;
  facilitator: string;
  teamName: string;
}
async function onJoinHandler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const query = req.query;
    const body = await Body.parseAsync(req.body);

    const params: Params = {
      organizationId: body.organizationId as string,
      teamId: body.teamId as string,
      retrospectiveId: query.id as string,
      members: body.members,
      activeMembers: body.activeMembers,
      boardName: body.boardName,
      facilitator: body.facilitator,
      teamName: body.teamName,
    };

    const result = (await moveMembersFromRetrospective(params)) as any;
    if (result.success === true) {
      res.send({ success: true });
    } else {
      res.status(404).send({ success: false, error: result.message });
    }
  } catch (error: any) {
    console.error(error);
    res.status(500).send({ success: false, error: error.message });
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
