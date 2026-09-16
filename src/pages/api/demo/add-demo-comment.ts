import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { withPipe } from '~/core/middleware/with-pipe';
import { withAuthedUser } from '~/core/middleware/with-authed-user';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';
import withCsrf from '~/core/middleware/with-csrf';

import { groupDemoComment } from '~/lib/server/demo/group-demo-comment';

const Body = z.object({
    id: z.string(),
    commentId: z.string(),
    status: z.string(),
    votes: z.number(),
    voters: z.any(),
});

const SUPPORTED_HTTP_METHODS: HttpMethod[] = ['POST', 'PUT'];

async function onJoinHandler(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;

    switch (method) {
        case 'POST': {
            try {
                const body = await Body.parseAsync(req.body);
                const data = {
                    id: body.id,
                    comment: body.commentId,
                    status: body.status,
                    votes: body.votes,
                    voters: body.voters,
                };

                const result = await groupDemoComment(data);

                if (result) {
                    res.send({ success: true, data: result });
                } else {
                    res.send({ success: false });
                }
            } catch (error) {
                console.error(error);
                res
                    .status(500)
                    .send({ success: false, error: 'Internal Server Error' });
            }
        }
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
