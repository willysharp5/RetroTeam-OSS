import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { completeOnboarding } from '~/lib/server/onboarding/complete-onboarding';
import { withPipe } from '~/core/middleware/with-pipe';
import { withAuthedUser } from '~/core/middleware/with-authed-user';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';
import withCsrf from '~/core/middleware/with-csrf';

const Body = z.object({
  organization: z.string(),
  teams: z.object({
    name: z.string(),
  }),
  name: z.string(),
  lastName: z.string(),
  email: z.string(),
});

const SUPPORTED_HTTP_METHODS: HttpMethod[] = ['POST'];

async function onboardingHandler(req: NextApiRequest, res: NextApiResponse) {
  const body = await Body.parseAsync(req.body);
  const userId = req.firebaseUser.uid;

  const data = {
    userId,
    organizationName: body.organization,
    teams: {
      name: body.teams.name,
    },
    name: body.name,
    lastName: body.lastName,
    email: body.email,
  };

  await completeOnboarding(data);

  return res.send({ success: true });
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
