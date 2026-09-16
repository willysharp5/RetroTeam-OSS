import { NextApiRequest, NextApiResponse } from 'next';
import { withAdmin as withFirebaseAdmin } from '~/core/middleware/with-admin';
import { isSuperAdmin } from '~/lib/admin/utils/is-super-admin';
import { throwUnauthorizedException } from '~/core/http-exceptions';
import withCsrf from '~/core/middleware/with-csrf';
import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';
import {
  getAIConfig,
  updateAIConfig,
  DEFAULT_CONFIG,
} from '~/lib/server/ai/ai-config';

const AI_CONFIG_COLLECTION = 'rules';
const AI_CONFIG_DOC = 'ai-config';

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  await withFirebaseAdmin();

  const isAdmin = await isSuperAdmin({ req, res });
  if (!isAdmin) {
    return throwUnauthorizedException();
  }

  const firestore = getRestFirestore();
  const docRef = firestore
    .collection(AI_CONFIG_COLLECTION)
    .doc(AI_CONFIG_DOC);
  const doc = await docRef.get();

  if (!doc.exists) {
    const seedData = {
      provider: DEFAULT_CONFIG.provider,
      model: DEFAULT_CONFIG.model,
      apiKey: process.env.AI_API_KEY || '',
      prompts: DEFAULT_CONFIG.prompts,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await docRef.set(seedData);
  }

  const config = await getAIConfig();

  return res.json({
    provider: config.provider,
    model: config.model,
    hasApiKey: !!config.apiKey,
    baseURL: config.baseURL || '',
    prompts: config.prompts,
    source: 'firestore',
  });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  await withFirebaseAdmin();
  await withCsrf()(req);

  const isAdmin = await isSuperAdmin({ req, res });
  if (!isAdmin) {
    return throwUnauthorizedException();
  }

  const { provider, model, apiKey, baseURL, prompts } = req.body;
  await updateAIConfig({
    ...(provider && { provider }),
    ...(model && { model }),
    ...(apiKey && { apiKey }),
    ...(baseURL !== undefined && { baseURL }),
    ...(prompts && { prompts }),
  });

  return res.json({ success: true, source: 'firestore' });
}

export default async function aiConfigHandler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  }

  if (req.method === 'POST') {
    return handlePost(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
