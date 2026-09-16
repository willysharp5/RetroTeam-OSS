import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { withPipe } from '~/core/middleware/with-pipe';
import { withAuthedUser } from '~/core/middleware/with-authed-user';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';
import withCsrf from '~/core/middleware/with-csrf';

import { updateActionstoJira } from '~/lib/server/actions/update-actions';

const Body = z.object({
    id: z.string(),
    url: z.string(),
    team: z.string(),
    boardId: z.string().optional()
});

interface Params {
    organization: string;
}

const SUPPORTED_HTTP_METHODS: HttpMethod[] = ['PUT', 'POST'];

async function onJoinHandler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'PUT') {
        try {

            const query = req.query;
            const params: Params = {
                organization: query.organization as string,
            };

            const body = await Body.parseAsync(req.body);

            const data = {
                id: body.id,
                url: body.url,
                organization: params.organization,
                team: body.team,
                boardId: body.boardId
            };

            const result = await updateActionstoJira(data);

            if (result) {
                res.send({ success: true, data: result });
            } else {
                res.send({ success: false });
            }
        } catch (error) {
            console.error(error);
            res.status(500).send({ success: false, error: 'Internal Server Error' });
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
