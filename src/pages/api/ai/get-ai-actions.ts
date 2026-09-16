


import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { AIKeyMissingError } from '~/lib/server/ai/call-ai';

import { withPipe } from '~/core/middleware/with-pipe';
import { withAuthedUser } from '~/core/middleware/with-authed-user';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';
import withCsrf from '~/core/middleware/with-csrf';
import { getActionsAI } from '~/lib/server/ai/get-actions';


const Body = z.object({
    allComments: z.any(),
    retrospectiveData:  z.any(),
    totalAiTokens: z.number(),
});


const SUPPORTED_HTTP_METHODS: HttpMethod[] = ['POST'];

async function onJoinHandler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const body = await Body.parseAsync(req.body);

        const result = await getActionsAI(body.allComments, body.retrospectiveData, body.totalAiTokens);

        if (result) {
            res.send({ success: true, data: result });
        } else {
            res.send({ success: false });
        }
    } catch (error) {
        console.error(error);

        // No provider key yet: this is a setup step for the self-hoster, not a
        // failure and definitely not an upgrade prompt, so say what to do.
        if (error instanceof AIKeyMissingError) {
            return res
                .status(503)
                .send({ success: false, error: error.message });
        }

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
