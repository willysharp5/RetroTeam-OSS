import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { getAuth } from 'firebase-admin/auth';
import { withPipe } from '~/core/middleware/with-pipe';
import { withMethodsGuard } from '~/core/middleware/with-methods-guard';
import { withExceptionFilter } from '~/core/middleware/with-exception-filter';
import withCsrf from '~/core/middleware/with-csrf';

import admin from 'firebase-admin';

import { USERS_COLLECTION } from '~/lib/firestore-collections';
import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';
import configuration from '~/configuration';

const Body = z.object({
    name: z.string(),
    email: z.string(),
    token: z.string(),
    lastName: z.string()
});

const SUPPORTED_HTTP_METHODS: HttpMethod[] = ['POST'];

async function onJoinHandler(req: NextApiRequest, res: NextApiResponse) {
    
    if (!admin.apps.length) {
        const base64Credentials =
            configuration.firebase.googleApplicationCredentials;
        const credentials = JSON.parse(atob(base64Credentials));

        admin.initializeApp({
            credential: admin.credential.cert(credentials),
        });
    }

    const auth = getAuth();

    const body = await Body.parseAsync(req.body);

    function encodeEmailToId(email: string): string {
        return Buffer.from(email).toString('base64url');
    }

    const uid = encodeEmailToId(body.email);

    // Check if the user exists in Firebase Auth
    try {
        const userRecord = await auth.getUser(uid);

        if (!userRecord.email) {
            await auth.updateUser(uid, {
                email: body.email,
            });
        }
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            // If the user does not exist, create it with the email
            await auth.createUser({
                uid,
                email: body.email,
            });
        } else {
            console.error('Firebase Auth error:', error);
            return res.status(500).json({ error: 'Error checking or creating user in Auth' });
        }
    }

    // Create the Firebase custom token
    const firebaseCustomToken = await auth.createCustomToken(uid);

    // Create the Firestore user document if it doesn't exist
    const firestore = getRestFirestore();
    const userPath = `/${USERS_COLLECTION}/${uid}`;
    const userRef = firestore.doc(userPath);
    const userSnapshot = await userRef.get();

    if (!userSnapshot.exists) {
        const fullName = body.name + ' ' + body.lastName
        const searchableName = fullName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s/g, '').toLowerCase();
        const searchableLastName = body.lastName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s/g, '').toLowerCase();

        const userData = {
            name: body.name,
            lastName: body.lastName,
            email: body.email,
            fullName,
            searchableName,
            searchableLastName,
            createdAt: Date.now(),
        };

        await userRef.set(userData);
        console.log('User document created');
    }

    return res.send({ success: true, token: firebaseCustomToken });
}


export default function completeOnJoinHandler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    const handler = withPipe(
        withCsrf(),
        withMethodsGuard(SUPPORTED_HTTP_METHODS),
        // withAuthedUser,
        onJoinHandler,
    );

    return withExceptionFilter(req, res)(handler);
}
