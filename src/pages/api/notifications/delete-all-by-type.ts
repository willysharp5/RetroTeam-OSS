import { NextApiRequest, NextApiResponse } from 'next';
import { withPipe } from '~/core/middleware/with-pipe';
import { withAuthedUser } from '~/core/middleware/with-authed-user';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';
import withCsrf from '~/core/middleware/with-csrf';
import { deleteNotification } from '~/lib/server/notifications/delete-notification';
import { z } from 'zod';
import { deleteNotificationsByType } from '~/lib/server/notifications/delete-notification-by-type';

const Body = z.object({
  organizationId: z.string(),
  type: z.string(),
  email: z.string(),
});

const SUPPORTED_HTTP_METHODS: HttpMethod[] = ['POST'];

interface Params {
  organizationId: string;
  type: string;
  email: string;
}

async function onJoinHandler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const body = await Body.parseAsync(req.body);

    const params: Params = {
      organizationId: body.organizationId as string,
      email: body.email as string,
      type: body.type as string,
    };

    const result = (await deleteNotificationsByType(params)) as any;
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
