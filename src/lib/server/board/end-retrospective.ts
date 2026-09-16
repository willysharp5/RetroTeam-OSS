import configuration from '~/configuration';
import { getOrganizationById, getRetrospectiveById, getUserData } from '../queries';


import { sendEmail } from '~/lib/server/email/send-email';
export async function endRetrospective(
  organizationId: string,
  retrospectiveId: string,
) {
  const retrospective = await getRetrospectiveById(
    organizationId,
    retrospectiveId,
  );
  const retrospectiveData = retrospective.data();

  const members = Object.values(retrospectiveData?.members);
  const facilitators = members.filter((member: any) => member.role > 0);

  const organization = await getOrganizationById(organizationId);
  const organizationData = organization.data();
  const organizationName = organizationData?.name as string;

  const sendEmailRequest = (email: string, userName: string) => {
    const message = `<p style="font-size: 16px;">Your retrospective <b>${retrospectiveData?.name}</b> has been completed.</p>`;

    sendNotificationEmail({
      email,
      userName,
      message,
      retrospectiveId,
      organizationId,
      organizationName
    });
  };

  for (const facilitator of facilitators as any) {
    if (facilitator) {
      const user = await getUserData(facilitator.userId);
      if (user) {
        sendEmailRequest(user.email, user.fullName);
      }
    }
  }

  await retrospective.ref.update({ finished: true });
}

function sendNotificationEmail(props: {
  email: string;
  userName: string;
  message: string;
  retrospectiveId: string;
  organizationId: string;
  organizationName: string;
}) {
  const { email, userName, message, retrospectiveId, organizationId, organizationName} = props;

  const link = getInvitePageFullUrl(organizationId, retrospectiveId);
  
  let data: any = {
    to: email,
    subject: `Retrospective Completed`,
    template: 'end-retrospective-email-template',
    'v:userName': userName,
    'v:message': message,
    'v:organizationName': organizationName,
    'v:here': `<a href="${link}"><b>here</b></a>`,
    'v:link': link,
    'v:email': email,
  };

  if (email) {
    void sendEmail(data);
  }
}
/*
 * @name getInvitePageFullUrl
 * @description Return the full URL to the invite page link.
 * @param organizationId
 * @param retrospectiveId
 */
function getInvitePageFullUrl(organizationId: string, retrospectiveId: string) {
  let siteUrl = configuration.site.siteUrl;
  assertSiteUrl(siteUrl);
  
  // Build the URL with retrospectiveId
  const url = [siteUrl, organizationId, 'results', retrospectiveId].join('/');
  
  // Add the email as a hash fragment
  const inviteUrl = `${url}#email`;
  
  return inviteUrl;
}


function assertSiteUrl(siteUrl: Maybe<string>): asserts siteUrl is string {
  if (!siteUrl && configuration.production) {
    throw new Error(
      `Please configure the "siteUrl" property in the configuration file ~/configuration.ts`,
    );
  }
}
