import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { getAIConfig, AIConfig, MISSING_AI_KEY_MESSAGE } from './ai-config';

async function getModel(config: AIConfig) {
  switch (config.provider) {
    case 'anthropic': {
      const anthropic = createAnthropic({ apiKey: config.apiKey });
      return anthropic(config.model);
    }
    case 'google': {
      const google = createGoogleGenerativeAI({ apiKey: config.apiKey });
      return google(config.model);
    }
    case 'openai-compatible': {
      const { createOpenAICompatible } = await import(
        '@ai-sdk/openai-compatible'
      );
      const provider = createOpenAICompatible({
        name: 'custom',
        baseURL: config.baseURL || '',
        headers: config.apiKey
          ? { Authorization: `Bearer ${config.apiKey}` }
          : {},
      });
      return provider(config.model);
    }
    case 'openai':
    default: {
      const openai = createOpenAI({
        apiKey: config.apiKey,
        ...(config.baseURL ? { baseURL: config.baseURL } : {}),
      });
      return openai(config.model);
    }
  }
}

/**
 * @name AIKeyMissingError
 * @description Thrown when an AI action is attempted before the self-hoster
 * has supplied a provider key. Callers surface `message` to the user verbatim.
 */
export class AIKeyMissingError extends Error {
  constructor() {
    super(MISSING_AI_KEY_MESSAGE);
    this.name = 'AIKeyMissingError';
  }
}

export async function callAI(
  promptKey: keyof AIConfig['prompts'],
  userMessage: string,
): Promise<string> {
  const config = await getAIConfig();

  // A custom OpenAI-compatible endpoint (Ollama, LM Studio, vLLM) may not need
  // a key at all, so a baseURL counts as configuration for that provider.
  const hasCredentials =
    config.provider === 'openai-compatible'
      ? Boolean(config.apiKey || config.baseURL)
      : Boolean(config.apiKey);

  if (!hasCredentials) {
    throw new AIKeyMissingError();
  }

  const promptConfig = config.prompts[promptKey];
  const model = await getModel(config);

  const { text } = await generateText({
    model,
    system: promptConfig.systemPrompt,
    prompt: userMessage,
    temperature: promptConfig.temperature,
  });

  return text;
}
