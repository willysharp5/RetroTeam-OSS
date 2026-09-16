import { NextApiRequest, NextApiResponse } from 'next';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { withAdmin as withFirebaseAdmin } from '~/core/middleware/with-admin';
import { isSuperAdmin } from '~/lib/admin/utils/is-super-admin';
import { throwUnauthorizedException } from '~/core/http-exceptions';
import withCsrf from '~/core/middleware/with-csrf';
import { getAIConfig } from '~/lib/server/ai/ai-config';

async function buildModel(provider: string, model: string, apiKey: string, baseURL?: string) {
  switch (provider) {
    case 'anthropic': {
      const anthropic = createAnthropic({ apiKey });
      return anthropic(model);
    }
    case 'google': {
      const google = createGoogleGenerativeAI({ apiKey });
      return google(model);
    }
    case 'openai-compatible': {
      const { createOpenAICompatible } = await import(
        '@ai-sdk/openai-compatible'
      );
      const custom = createOpenAICompatible({
        name: 'custom',
        baseURL: baseURL || '',
        headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      });
      return custom(model);
    }
    case 'openai':
    default: {
      const openai = createOpenAI({
        apiKey,
        ...(baseURL ? { baseURL } : {}),
      });
      return openai(model);
    }
  }
}

export default async function testAIConfigHandler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await withFirebaseAdmin();
  await withCsrf()(req);

  const isAdmin = await isSuperAdmin({ req, res });
  if (!isAdmin) {
    return throwUnauthorizedException();
  }

  const { provider, model: modelName, apiKey: newApiKey, baseURL } = req.body;

  if (!provider || !modelName) {
    return res.status(400).json({
      success: false,
      error: 'Provider and model are required.',
    });
  }

  let resolvedApiKey = newApiKey;
  if (!resolvedApiKey) {
    const existingConfig = await getAIConfig();
    resolvedApiKey = existingConfig.apiKey;
  }

  if (!resolvedApiKey && provider !== 'openai-compatible') {
    return res.status(400).json({
      success: false,
      error: 'No API key configured. Enter an API key first.',
    });
  }

  try {
    const aiModel = await buildModel(provider, modelName, resolvedApiKey || '', baseURL);

    const { text } = await generateText({
      model: aiModel,
      prompt: 'Reply with exactly: OK',
      maxOutputTokens: 10,
      temperature: 0,
    });

    return res.json({
      success: true,
      response: text.trim(),
      message: `Model "${modelName}" is working.`,
    });
  } catch (err: any) {
    let errorMessage = 'Unknown error';

    if (err?.data?.error?.message) {
      errorMessage = err.data.error.message;
    } else if (err?.responseBody) {
      try {
        const body = JSON.parse(err.responseBody);
        errorMessage = body?.error?.message || err.message;
      } catch {
        errorMessage = err.message;
      }
    } else if (err?.message) {
      errorMessage = err.message;
    }

    const statusCode = err?.statusCode || 0;

    let hint = '';
    if (statusCode === 404 || errorMessage.includes('not found')) {
      hint = 'The model name may be incorrect. Check the exact model ID for your provider.';
    } else if (statusCode === 401 || statusCode === 403 || errorMessage.includes('API key')) {
      hint = 'Your API key may be invalid, expired, or revoked. Generate a new key from your provider.';
    } else if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND')) {
      hint = 'Cannot reach the API endpoint. Check the Base URL or your network connection.';
    }

    return res.status(200).json({
      success: false,
      error: errorMessage,
      hint,
      statusCode,
    });
  }
}
