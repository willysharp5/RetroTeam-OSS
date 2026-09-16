import { NextApiRequest, NextApiResponse } from 'next/types';

import { withPipe } from '~/core/middleware/with-pipe';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';
import withCsrf from '~/core/middleware/with-csrf';
import { z } from 'zod';
import configuration from '~/configuration';

const SUPPORTED_HTTP_METHODS: HttpMethod[] = ['POST'];
const Body = z.object({
    domain: z.string(),
    projectKey: z.string(),
    text: z.string(),
    issueType: z.string(),
    email: z.string(),
    apiToken: z.string(),
    epic: z.string().optional(),
    userName: z.string(),
    userURL: z.string(),
});
async function onJoinHandler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const body = await Body.parseAsync(req.body);

        const username = body.email as string;
        const apiToken = body.apiToken as string;

        if (!username || !apiToken) {
            return res.status(400).json({ error: 'Missing credentials' });
        }
        const auth = Buffer.from(`${username}:${apiToken}`).toString('base64');

        const bodyData = {
            fields: {
                project: {
                    key: body.projectKey,
                },
                summary: body.text,
                description: {
                    type: 'doc',
                    version: 1,
                    content: [
                        {
                            type: 'paragraph',
                            content: [
                                {
                                    type: 'text',
                                    text: 'Action Item added from ',
                                },
                                {
                                    type: 'text',
                                    text: 'RetroTeam.ai',
                                    marks: [
                                        {
                                            type: 'link',
                                            attrs: {
                                                href: configuration.site.siteUrl,
                                            },
                                        },
                                    ],
                                },
                                {
                                    type: 'text',
                                    text: ` by`,
                                },
                                   {
                                    type: 'text',
                                    text: ` ${body.userName}.`,
                                    marks: [
                                        {
                                            type: 'link',
                                            attrs: {
                                                href: body.userURL,
                                            },
                                        },
                                    ],
                                },
                            ],
                        }, // <- cierre correcto del paragraph
                    ],
                },
                issuetype: {
                    name: body.issueType,
                },
                ...(body.epic && { parent: { key: body.epic } }),
            },
        };


        const response = await fetch(`${body.domain}/rest/api/3/issue`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bodyData),
        });

        if (!response.ok) {
            let errorMessage = 'Failed to create Jira Ticket'
            const errorBody = await response.json();

            if (errorBody?.errors) {
                errorMessage = Object.values(errorBody.errors).join('\n');

            } else if (errorBody?.errorMessages?.length > 0) {
                errorMessage = (errorBody.errorMessages.join('\n'));
            }

            return res.status(response.status).json({ error: errorBody.errors });
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
