import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import logger from '~/core/logger';

import { withAuthedUser } from '~/core/middleware/with-authed-user';

import { throwInternalServerErrorException } from '~/core/http-exceptions';

import { withPipe } from '~/core/middleware/with-pipe';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';
import withCsrf from '~/core/middleware/with-csrf';
import { sendContactForm } from '~/lib/server/contact/contact-us-form';

const SUPPORTED_METHODS: HttpMethod[] = ['POST'];

const Body = z.object({
  fullName: z.string(),
  email: z.string(),
  company: z.string(),
  subject: z.string(),
  message: z.string(),
  organizationId: z.string(),
  organizationName: z.string(),
  internalEmail: z.string(),
});

async function contactUsHandler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const body = await Body.parseAsync(req.body);
    const data = {
      fullName: body.fullName,
      formEmail: body.email,
      company: body.company,
      subject: body.subject,
      message: body.message,
      timestamp: new Date(),
      organizationId: body.organizationId,
      organizationName: body.organizationName,
      internalEmail: body.internalEmail,
    };

    await sendContactForm(data);

    logger.info(`Sending contact form`);

    return res.send({ success: true });
  } catch (error) {
    logger.error(`Error sending contact form: ${error}`);

    return throwInternalServerErrorException(error?.toString());
  }
}

export default function contacthandler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const handler = withPipe(
    withMethodsGuard(SUPPORTED_METHODS),
    withCsrf(),
    withAuthedUser,
    contactUsHandler,
  );

  return withExceptionFilter(req, res)(handler);
}
