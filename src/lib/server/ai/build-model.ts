import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

import type { AIProvider } from './ai-config';
import { OPENROUTER_BASE_URL } from './ai-config';

/**
 * @name buildModel
 * @description Turns a provider + model + credential into a language model.
 *
 * This is the single place that maps a provider to an SDK client. It used to be
 * duplicated between `call-ai.ts` and the admin "Test connection" endpoint,
 * which is how you end up with a Test that passes against a provider the real
 * calls cannot reach.
 */
export async function buildModel(
  provider: AIProvider | string,
  model: string,
  apiKey: string,
  baseURL?: string,
) {
  switch (provider) {
    case 'anthropic': {
      const anthropic = createAnthropic({ apiKey });
      return anthropic(model);
    }

    case 'google': {
      const google = createGoogleGenerativeAI({ apiKey });
      return google(model);
    }

    case 'openrouter': {
      const { createOpenAICompatible } = await import(
        '@ai-sdk/openai-compatible'
      );

      // OpenRouter speaks the OpenAI protocol, so it needs no dedicated SDK
      // package — only its own base URL, which the self-hoster never has to
      // type. It is a separate provider rather than a preset of
      // "openai-compatible" because it always requires a key, whereas a local
      // Ollama server never does.
      const openrouter = createOpenAICompatible({
        name: 'openrouter',
        baseURL: baseURL || OPENROUTER_BASE_URL,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          // Optional attribution, used by OpenRouter's own dashboards. Harmless
          // if ignored, and it identifies the traffic as this app rather than an
          // anonymous script.
          'X-Title': 'RetroTeam OSS',
        },
      });

      return openrouter(model);
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
