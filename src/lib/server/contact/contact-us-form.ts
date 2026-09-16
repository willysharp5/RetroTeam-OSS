import configuration from '~/configuration';
import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';
import { getEmailsCollection } from '../collections';


import { sendEmail } from '~/lib/server/email/send-email';
export async function sendContactForm(props: {
  fullName: string;
  internalEmail: string;
  formEmail: string;
  company: string;
  subject: string;
  message: string;
  timestamp: any;
  organizationId: string;
  organizationName: string;
}) {
  const {
    fullName,
    internalEmail,
    formEmail,
    company,
    subject,
    message,
    timestamp,
    organizationId,
    organizationName,
  } = props;

  const firestore = getRestFirestore();
  const batch = firestore.batch();
  const emailsRef = getEmailsCollection().doc() as any;

  try {
    batch.create(emailsRef, {
      fullName,
      formEmail,
      company,
      subject,
      message,
      jsonString: JSON.stringify(props),
      timestamp,
      organizationId,
      organizationName,
      internalEmail,
    });

    await batch.commit();
  } catch (error) {
    console.error('Error', error);
  }

  let data: any = {
    from: `RetroTeam <${formEmail}>`,
    to: configuration.email.contactEmail,
    subject: subject,
    html: `  
        <div style="padding: 16px; background-color: #f9fafb; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 12px;">Contact Form Submission</h2>
          <p><strong>Full Name:</strong> ${fullName}</p>
          <p><strong>Internal Email:</strong> ${internalEmail}</p>
          <p><strong>Form Email:</strong> ${formEmail}</p>
          <p><strong>Company:</strong> ${company}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <div style="padding: 12px; border: 1px solid #e5e7eb; border-radius: 4px; background-color: #ffffff;">
            ${message}
          </div>
          <p><strong>Submitted Data (JSON):</strong></p>
          <div style="padding: 12px; border: 1px solid #e5e7eb; border-radius: 4px; background-color: #ffffff;">
            <pre style="font-size: 14px; white-space: pre-wrap; word-wrap: break-word;">
              ${JSON.stringify(props, null, 2)}
            </pre>
          </div>
        </div>`,
  };

  if (formEmail) {
    void sendEmail(data);
  }
}
