import { NextApiRequest, NextApiResponse } from 'next';

import { withPipe } from '~/core/middleware/with-pipe';
import { withAuthedUser } from '~/core/middleware/with-authed-user';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';
import withCsrf from '~/core/middleware/with-csrf';

import { deleteAction } from '~/lib/server/board/delete-action';
import { z } from 'zod';

const SUPPORTED_HTTP_METHODS: HttpMethod[] = ['PUT'];

const Body = z.object({
    retrospectiveId: z.string(),
    organizationId: z.string(),
    id: z.string()
});


async function onJoinHandler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const body = await Body.parseAsync(req.body);
        const data = {
            actionId: body.id,
            organization: body.organizationId,
            retrospectiveId: body.retrospectiveId,
        };
        const result = await deleteAction(data);

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
