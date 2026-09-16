import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';

import { NextApiRequest, NextApiResponse } from 'next';
import configuration from '~/configuration';

if (!admin.apps.length) {
  const base64Credentials =
    configuration.firebase.googleApplicationCredentials;
  const credentials = JSON.parse(atob(base64Credentials));

  admin.initializeApp({
    credential: admin.credential.cert(credentials),
  });
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { uid } = req.query;

  try {
    const auth = await getAuth().getUser(uid as string);

    res.status(200).json({ disabled: auth.disabled });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user information' });
  }
};
