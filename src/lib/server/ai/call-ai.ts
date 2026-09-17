import { generateText } from 'ai';

import { getAIConfig, AIConfig, MISSING_AI_KEY_MESSAGE } from './ai-config';
import { buildModel } from './build-model';

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
  const model = await buildModel(
    config.provider,
    config.model,
    config.apiKey,
    config.baseURL,
  );

  const { text } = await generateText({
    model,
    system: promptConfig.systemPrompt,
    prompt: userMessage,
    temperature: promptConfig.temperature,
  });

  return text;
}
