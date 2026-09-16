import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';
import {
  getOrganizations,
  getRetrospectiveCollection,
  getRules,
} from '../collections';
import configuration from '~/configuration';
import { getUserData } from '../queries';
import admin from 'firebase-admin';


import { sendEmail } from '~/lib/server/email/send-email';
export default async function finishRetrospectives() {
  if (!admin.apps.length) {
    const base64Credentials =
      configuration.firebase.googleApplicationCredentials;
    const credentials = JSON.parse(atob(base64Credentials));

    admin.initializeApp({
      credential: admin.credential.cert(credentials),
    });
  }
  try {
    const organizations = await getOrganizations().get();

    const rules = await getRules().where('section', '==', 'boards').get();

    let expirateDays = 10;

    for (const doc of rules.docs) {
      const data = doc.data();
      expirateDays = data.expirationDay;
    }

    const currentDate = new Date();
    const expirationDays = new Date(currentDate);
    expirationDays.setDate(expirationDays.getDate() - expirateDays);

    const firestore = getRestFirestore();
    const batch = firestore.batch();

    let retrospectives = [] as any;

    for (const doc of organizations.docs) {
      const organizationId = doc.id;
      const organizationData = doc.data();

      const retrospectiveCollectionRef = await getRetrospectiveCollection(
        organizationId,
      )
        .where('date', '<=', expirationDays)
        .where('finished', '==', false)
        .get();

      if (retrospectiveCollectionRef.size > 0) {
        await Promise.all(
          retrospectiveCollectionRef.docs.map(async (doc) => {
            try {
              const retrospectiveData = doc.data();
              const retrospectiveId = doc.id;
              const docRef = doc.ref;

              const organizationName = organizationData?.name as string;

              const sendEmailRequest = (email: string, userName: string) => {
                const message = `<p style="font-size: 16px;">Your retrospective <b>${retrospectiveData?.name}</b> has been open for more than ${expirateDays} days. We have automatically completed it.</p>`;

                sendNotificationEmail({
                  email,
                  userName,
                  message,
                  retrospectiveId,
                  organizationId,
                  organizationName
                });
              };

              //Update retrosepctive
              await batch.update(docRef, { finished: true });
              retrospectives.push({
                organizationId,
                retrospectiveId: doc.id,
                name: retrospectiveData.name,
                created: retrospectiveData.date,
              });

              // Send email to facilitators
              const members = Object.values(retrospectiveData?.members);
              const facilitators = members.filter(
                (member: any) => member.role > 0,
              );

              for (const facilitator of facilitators as any) {
                if (facilitator) {
                  const user = await getUserData(facilitator.userId);
                  if (user) {
                    sendEmailRequest(user.email, user.fullName);
                  }
                }
              }
            } catch (error) {
              console.error('Error updating retrospective:', error);
            }
          }),
        );
      }
    }

    await batch.commit();
    if (retrospectives.length === 0) {
      return { success: true, data: 'There are no overdue retrospectives' };
    } else {
      return { success: true, data: retrospectives };
    }
  } catch (error) {
    console.error('Error finishing retrospectives:', error);
    return { success: false, error };
  }
}

function sendNotificationEmail(props: {
  email: string;
  userName: string;
  message: string;
  retrospectiveId: string;
  organizationId: string;
  organizationName: string;
}) {
  const { email, userName, message, retrospectiveId, organizationId, organizationName } = props;

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
