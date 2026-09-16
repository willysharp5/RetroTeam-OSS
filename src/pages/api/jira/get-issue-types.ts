import { NextApiRequest, NextApiResponse } from 'next/types';

import { withPipe } from '~/core/middleware/with-pipe';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';
import withCsrf from '~/core/middleware/with-csrf';
import { z } from 'zod';

const SUPPORTED_HTTP_METHODS: HttpMethod[] = ['POST'];
const Body = z.object({
    projectId: z.string(),
    email: z.string(),
    apiToken: z.string(),
    domain: z.string()
});
async function onJoinHandler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const body = await Body.parseAsync(req.body);

        const username = body.email as string;
        const apiToken = body.apiToken as string;
        const domain = body.domain as string;

        if (!username || !apiToken) {
            return res.status(400).json({ error: 'Missing credentials' });
        }
        const auth = Buffer.from(`${username}:${apiToken}`).toString('base64');

        const response = await fetch(`${domain}/rest/api/3/issuetype/project?projectId=${body.projectId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: 'Failed to fetch Jira issues' });
        }

        const data = await response.json();
        return res.status(200).json(data);

    } catch (err) {
        console.error('Error fetching Jira projects:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}


export default function completeOnJoinHandler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    const handler = withPipe(
        withCsrf(),
        withMethodsGuard(SUPPORTED_HTTP_METHODS),
        onJoinHandler,
    );

    return withExceptionFilter(req, res)(handler);
}
