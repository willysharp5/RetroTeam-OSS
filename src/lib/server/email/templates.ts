import configuration from '~/configuration';

/**
 * @name EmailVariables
 * @description Values interpolated into an email template. These map 1:1 to
 * the `v:<name>` keys accepted by {@link sendEmail}.
 */
export type EmailVariables = Record<string, unknown>;

const siteName = configuration.site.siteName;

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function str(variables: EmailVariables, ...names: string[]) {
  for (const name of names) {
    const value = variables[name];

    if (typeof value === 'string' && value.trim() !== '') {
      return value;
    }
  }

  return undefined;
}

/**
 * @name layout
 * @description The shared wrapper for every transactional email. Plain inline
 * CSS so it renders the same in every client — edit freely, it is yours.
 */
function layout(props: {
  greeting?: string;
  body: string;
  cta?: { href: string; label: string };
  recipient?: string;
}) {
  const { greeting, body, cta, recipient } = props;

  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e4e4e7;border-radius:8px;">
      <tr>
        <td style="padding:32px;">
          <p style="margin:0 0 24px;font-size:18px;font-weight:600;">${escapeHtml(siteName)}</p>
          ${greeting ? `<p style="margin:0 0 16px;font-size:16px;">${escapeHtml(greeting)}</p>` : ''}
          <div style="font-size:14px;line-height:22px;">${body}</div>
          ${
            cta
              ? `<p style="margin:28px 0 0;">
            <a href="${escapeHtml(cta.href)}" style="display:inline-block;padding:10px 20px;background:#18181b;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;">${escapeHtml(cta.label)}</a>
          </p>
          <p style="margin:16px 0 0;font-size:12px;color:#71717a;">If the button does not work, copy this link into your browser:<br /><span style="word-break:break-all;">${escapeHtml(cta.href)}</span></p>`
              : ''
          }
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 28px;font-size:12px;color:#a1a1aa;">
          ${recipient ? `Sent to ${escapeHtml(recipient)}.` : ''}
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

type TemplateRenderer = (variables: EmailVariables) => string;

/**
 * @name TEMPLATES
 * @description Local renderers for the transactional emails the app sends.
 * The keys are the template names used at the call sites.
 *
 * `message` variables may already contain HTML built by the caller, so they are
 * interpolated as-is. Everything else is escaped.
 */
const TEMPLATES: Record<string, TemplateRenderer> = {
  'welcome-email-template': (v) =>
    layout({
      greeting: `Welcome${str(v, 'name', 'userName') ? `, ${str(v, 'name', 'userName')}` : ''}!`,
      body: `<p>Your ${escapeHtml(siteName)} account is ready. Create your first retrospective whenever you are.</p>`,
      cta: str(v, 'link', 'url')
        ? { href: str(v, 'link', 'url')!, label: 'Create a retrospective' }
        : undefined,
      recipient: str(v, 'email'),
    }),

  'board invite email template': (v) =>
    layout({
      greeting: str(v, 'names', 'userName')
        ? `Hi ${str(v, 'names', 'userName')},`
        : undefined,
      body: `<p><b>${escapeHtml(str(v, 'facilitator') ?? 'A teammate')}</b> invited you to join <b>${escapeHtml(str(v, 'retrospective', 'boardName', 'organizationName') ?? siteName)}</b>.</p>
        ${str(v, 'expiration') ? `<p style="color:#71717a;">This invitation expires in ${escapeHtml(str(v, 'expiration'))}.</p>` : ''}`,
      cta: str(v, 'invitation_code', 'link', 'url')
        ? {
            href: str(v, 'invitation_code', 'link', 'url')!,
            label: 'Accept invitation',
          }
        : undefined,
      recipient: str(v, 'email'),
    }),

  'removed/added team message': (v) =>
    layout({
      greeting: str(v, 'names', 'userName')
        ? `Hi ${str(v, 'names', 'userName')},`
        : undefined,
      body: `<p>You were <b>${escapeHtml(str(v, 'type') ?? 'updated')}</b>${
        str(v, 'teamName') ? ` in the team <b>${escapeHtml(str(v, 'teamName'))}</b>` : ''
      }${
        str(v, 'organizationName')
          ? ` of <b>${escapeHtml(str(v, 'organizationName'))}</b>`
          : ''
      }${str(v, 'adminName') ? ` by ${escapeHtml(str(v, 'adminName'))}` : ''}.</p>`,
      cta: str(v, 'url', 'link')
        ? {
            href: str(v, 'url', 'link')!,
            label: str(v, 'buttonTitle') ?? `Go to ${siteName}`,
          }
        : undefined,
      recipient: str(v, 'email'),
    }),

  'updated role message': (v) =>
    layout({
      greeting: str(v, 'names', 'userName')
        ? `Hi ${str(v, 'names', 'userName')},`
        : undefined,
      body: `<p>${escapeHtml(str(v, 'adminName') ?? 'An administrator')} updated your role${
        str(v, 'organizationName')
          ? ` in <b>${escapeHtml(str(v, 'organizationName'))}</b>`
          : ''
      }${
        str(v, 'oldRoleName') && str(v, 'newRoleName')
          ? ` from <b>${escapeHtml(str(v, 'oldRoleName'))}</b> to <b>${escapeHtml(str(v, 'newRoleName'))}</b>`
          : ''
      }.</p>`,
      cta: str(v, 'link', 'url')
        ? {
            href: str(v, 'link', 'url')!,
            label: str(v, 'buttonTitle') ?? `Go to ${siteName}`,
          }
        : undefined,
      recipient: str(v, 'email'),
    }),

  'Member Announcements': (v) =>
    layout({
      greeting: str(v, 'names', 'userName'),
      body: str(v, 'message') ?? `<p>There is an update waiting for you in ${escapeHtml(siteName)}.</p>`,
      cta: str(v, 'url', 'link')
        ? {
            href: str(v, 'url', 'link')!,
            label: str(v, 'buttonTitle') ?? `Go to ${siteName}`,
          }
        : undefined,
      recipient: str(v, 'email'),
    }),

  'end-retrospective-email-template': (v) =>
    layout({
      greeting: str(v, 'userName', 'names')
        ? `Hi ${str(v, 'userName', 'names')},`
        : undefined,
      body: `${
        str(v, 'message')
          ? `<p>${str(v, 'message')}</p>`
          : `<p>A retrospective${
              str(v, 'retrospective', 'boardName')
                ? ` — <b>${escapeHtml(str(v, 'retrospective', 'boardName'))}</b>`
                : ''
            } has been completed${
              str(v, 'organizationName')
                ? ` in <b>${escapeHtml(str(v, 'organizationName'))}</b>`
                : ''
            }.</p>`
      }<p>You can review the results and the action items that came out of it.</p>`,
      cta: str(v, 'link', 'url')
        ? { href: str(v, 'link', 'url')!, label: 'View the results' }
        : undefined,
      recipient: str(v, 'email'),
    }),

  'disabled user account': (v) =>
    layout({
      greeting: str(v, 'userName', 'names')
        ? `Hi ${str(v, 'userName', 'names')},`
        : undefined,
      body: `<p>Your ${escapeHtml(siteName)} account${
        str(v, 'organizationName')
          ? ` in <b>${escapeHtml(str(v, 'organizationName'))}</b>`
          : ''
      } has been deleted. No further action is needed.</p>`,
      recipient: str(v, 'email'),
    }),

  'admin message': (v) =>
    layout({
      body: `<p>Administrator notice:</p>
        <ul>
          ${str(v, 'userName') ? `<li>User: ${escapeHtml(str(v, 'userName'))}</li>` : ''}
          ${str(v, 'userEmail') ? `<li>Email: ${escapeHtml(str(v, 'userEmail'))}</li>` : ''}
          ${str(v, 'userId') ? `<li>User ID: ${escapeHtml(str(v, 'userId'))}</li>` : ''}
          ${str(v, 'organizationName') ? `<li>Organization: ${escapeHtml(str(v, 'organizationName'))}</li>` : ''}
          ${str(v, 'organizationId') ? `<li>Organization ID: ${escapeHtml(str(v, 'organizationId'))}</li>` : ''}
        </ul>`,
      cta: str(v, 'adminUsersLink', 'adminOrganizationsLink', 'link', 'url')
        ? {
            href: str(v, 'adminUsersLink', 'adminOrganizationsLink', 'link', 'url')!,
            label: 'Open the admin area',
          }
        : undefined,
      recipient: str(v, 'email'),
    }),
};

/**
 * @name renderTemplate
 * @description Render `template` with `variables`. Unknown template names fall
 * back to a generic notification body so a new call site can never crash the
 * send.
 */
export function renderTemplate(
  template: string | undefined,
  variables: EmailVariables,
) {
  const renderer = template ? TEMPLATES[template] : undefined;

  if (renderer) {
    return renderer(variables);
  }

  if (template) {
    console.warn(
      `[email] Unknown template "${template}". Falling back to the generic layout.`,
    );
  }

  return layout({
    greeting: str(variables, 'names', 'userName', 'name'),
    body:
      str(variables, 'message') ??
      `<p>There is an update waiting for you in ${escapeHtml(siteName)}.</p>`,
    cta: str(variables, 'link', 'url')
      ? {
          href: str(variables, 'link', 'url')!,
          label: str(variables, 'buttonTitle') ?? `Go to ${siteName}`,
        }
      : undefined,
    recipient: str(variables, 'email'),
  });
}

/**
 * @name toPlainText
 * @description Crude HTML → text conversion for the multipart alternative.
 */
export function toPlainText(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|li|div|tr|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
