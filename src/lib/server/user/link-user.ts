import { getUsersCollection } from '~/lib/server/collections';
import configuration from '~/configuration';

import { sendEmail } from '~/lib/server/email/send-email';
interface Params {
  userId: string;
  email: string;
}

function sendNotificationEmail(props: {
  name: string;
  subscription: string;
  email: string;
}) {
  const { name, subscription, email } = props;

  const link = getInvitePageFullUrl();

  let data: any = {
    to: email,
    subject: `Welcome to Retroteam!`,
    template: 'welcome-email-template',
    'v:name': name,
    'v:subscription': subscription,
    'v:email': email,
    'v:link': link,
  };

  if (email) {
    void sendEmail(data);
  }
}

/**
 * @name createUser
 * @description Handles the submission of the join non authenticated user flow. By default,
 * we use the submission to create the user record
 * associated with the User who signed up using its ID
 * @param userId
 * @param organizationName
 */

export async function linkUser({ userId, email }: Params) {
  const userRef = getUsersCollection().doc(userId);

  try {
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      // Get user data
      const userData = userDoc.data() as any;
      const { name, lastName } = userData;

      const fullName = name + ' ' + lastName;

      // Update email field
      return new Promise((resolve, reject) => {
        userRef
          .update({
            email: email,
          })
          .then(() => {
            sendNotificationEmail({
              name: fullName,
              subscription: 'Free Subscription',
              email,
            });
            resolve({ status: 'success', fullName });
          })
          .catch((error) => {
            console.error('Error', error);
            reject('error');
          });
      });
    } else {
      console.error('Document doesnt exist');
      return 'error';
    }
  } catch (error) {
    console.error('Error', error);
    return 'error';
  }
}
/*
 * @name getInvitePageFullUrl
 * @description Return the full URL to the invite page link. For example,
 * <your-site-url>/auth/invite/{INVITE_CODE}
 * @param inviteCode
 */
function getInvitePageFullUrl() {
  let siteUrl = configuration.site.siteUrl;
  assertSiteUrl(siteUrl);
  const url = [siteUrl, 'retrospectives', 'create'].join('/');
  return url;
}

function assertSiteUrl(siteUrl: Maybe<string>): asserts siteUrl is string {
  if (!siteUrl && configuration.production) {
    throw new Error(
      `Please configure the "siteUrl" property in the configuration file ~/configuration.ts`,
    );
  }
}
