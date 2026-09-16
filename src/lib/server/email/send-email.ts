import type { Transporter } from 'nodemailer';

import configuration from '~/configuration';
import { renderTemplate, toPlainText, EmailVariables } from './templates';

/**
 * @name EmailMessage
 * @description A single transactional email.
 *
 * Template variables are passed as `v:<name>` keys — for example
 * `'v:userName': 'Ada'` — or in a `variables` object. Pass `html` (or `text`)
 * to bypass templating entirely.
 */
export interface EmailMessage {
  to: string | string[];
  subject: string;
  from?: string;
  template?: string;
  variables?: EmailVariables;
  html?: string;
  text?: string;
  [variable: `v:${string}`]: unknown;
}

let transporter: Transporter | undefined;
let warnedAboutMissingConfig = false;

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const port = Number(process.env.SMTP_PORT ?? 587);

  if (!host) {
    return undefined;
  }

  return {
    host,
    port,
    // Implicit TLS on 465, STARTTLS everywhere else — override with SMTP_SECURE
    secure: process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE === 'true'
      : port === 465,
    auth: user ? { user, pass } : undefined,
  };
}

function getSender(explicitFrom?: string) {
  return (
    explicitFrom ??
    process.env.EMAIL_SENDER ??
    (configuration.email.contactEmail
      ? `"${configuration.site.siteName}" <${configuration.email.contactEmail}>`
      : undefined)
  );
}

/**
 * @name isEmailConfigured
 * @description Whether outbound email can be sent. Use it to decide whether a
 * flow needs to surface a link in the UI instead of relying on an email.
 */
export function isEmailConfigured() {
  return Boolean(getSmtpConfig() && getSender());
}

function extractVariables(message: EmailMessage): EmailVariables {
  const variables: EmailVariables = { ...(message.variables ?? {}) };

  for (const [key, value] of Object.entries(message)) {
    if (key.startsWith('v:')) {
      variables[key.slice(2)] = value;
    }
  }

  return variables;
}

/**
 * @name sendEmail
 * @description Send a transactional email over SMTP.
 *
 * This never throws. When SMTP is not configured — the default for a fresh
 * self-hosted install — it logs a warning, prints the rendered link-bearing
 * payload to the server log so the flow is still completable by hand, and
 * resolves to `false`. Callers therefore do not need to guard their calls.
 *
 * Configure it with SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD,
 * SMTP_SECURE and EMAIL_SENDER. See `.env.example`.
 */
export async function sendEmail(message: EmailMessage): Promise<boolean> {
  const recipients = Array.isArray(message.to)
    ? message.to.filter(Boolean)
    : [message.to].filter(Boolean);

  if (!recipients.length) {
    return false;
  }

  const variables = extractVariables(message);
  const html = message.html ?? renderTemplate(message.template, variables);
  const text = message.text ?? toPlainText(html);

  const smtp = getSmtpConfig();
  const from = getSender(message.from);

  if (!smtp || !from) {
    if (!warnedAboutMissingConfig) {
      warnedAboutMissingConfig = true;

      console.warn(
        '[email] SMTP is not configured, so no email will be sent. Set SMTP_HOST (and, if your provider requires it, SMTP_USER / SMTP_PASSWORD) plus EMAIL_SENDER to enable outbound email. Emails are logged below instead.',
      );
    }

    console.info('[email] Skipped sending:', {
      to: recipients,
      subject: message.subject,
      template: message.template,
      body: text,
    });

    return false;
  }

  try {
    if (!transporter) {
      // Imported lazily so the SMTP client never ends up in a client bundle.
      const nodemailer = await import('nodemailer');
      transporter = nodemailer.createTransport(smtp);
    }

    await transporter.sendMail({
      from,
      to: recipients.join(', '),
      subject: message.subject,
      html,
      text,
    });

    return true;
  } catch (error) {
    // Email is never critical to the request that triggered it: log and move on.
    console.error('[email] Failed to send email', {
      to: recipients,
      subject: message.subject,
      template: message.template,
      error,
    });

    return false;
  }
}

export default sendEmail;
