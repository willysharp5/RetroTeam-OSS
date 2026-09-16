import { NextApiRequest, NextApiResponse } from 'next';

import { withPipe } from '~/core/middleware/with-pipe';
import { withAuthedUser } from '~/core/middleware/with-authed-user';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';
import withCsrf from '~/core/middleware/with-csrf';

import { z } from 'zod';
import { deleteDemoAction } from '~/lib/server/demo/delete-demo-action';

const SUPPORTED_HTTP_METHODS: HttpMethod[] = ['PUT'];

const Body = z.object({
    id: z.string()
});


async function onJoinHandler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const body = await Body.parseAsync(req.body);
        const data = {
            actionId: body.id,
        };
        const result = await deleteDemoAction(data);

        if (result.success === true) {
            res.send({ success: true });
        } else {
            res.status(404).send({ success: false, error: 'Action not found' });
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
