import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { withPipe } from '~/core/middleware/with-pipe';
import { withAuthedUser } from '~/core/middleware/with-authed-user';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';
import withCsrf from '~/core/middleware/with-csrf';
import { createOrganization } from '~/lib/server/admin/create-organization';

const Body = z.object({
    organization: z.string(),
    teamName: z.string(),
    name: z.string(),
    lastName: z.string(),
    email: z.string(),
    password: z.string().optional(),
});

const SUPPORTED_HTTP_METHODS: HttpMethod[] = ['POST'];

async function onboardingHandler(req: NextApiRequest, res: NextApiResponse) {
    const body = await Body.parseAsync(req.body);

    const data = {
        organizationName: body.organization,
        teamName: body.teamName,
        name: body.name,
        lastName: body.lastName,
        email: body.email,
        password: body.password
    };

    const result = await createOrganization(data);

    if (result.success === true) {
        res.send({ success: true });
    } else {
        res.status(404).send({ success: false, error: result.message});
    }
}

export default function completeOnboardingHandler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    const handler = withPipe(
        withCsrf(),
        withMethodsGuard(SUPPORTED_HTTP_METHODS),
        withAuthedUser,
        onboardingHandler,
    );

    return withExceptionFilter(req, res)(handler);
}
