import { initializeFirebaseAdminApp } from '~/core/firebase/admin/initialize-firebase-admin-app';
import getRestFirestore from '~/core/firebase/admin/get-rest-firestore';

export interface AIPromptConfig {
  systemPrompt: string;
  temperature: number;
}

export type AIProvider =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'openai-compatible';

export interface AIConfig {
  provider: AIProvider;
  model: string;
  apiKey: string;
  baseURL?: string;
  prompts: {
    groupAndTags: AIPromptConfig;
    actions: AIPromptConfig;
    patternsAdvice: AIPromptConfig;
    improvementAreas: AIPromptConfig;
  };
}

const AI_CONFIG_COLLECTION = 'rules';
const AI_CONFIG_DOC = 'ai-config';

/**
 * @name MISSING_AI_KEY_MESSAGE
 * @description Shown whenever an AI action is attempted with no key. This is a
 * bring-your-own-key build: there is no hosted key and no paid tier, so the
 * only thing missing is the self-hoster's own credential.
 */
export const MISSING_AI_KEY_MESSAGE =
  'No AI API key is configured. Add your own API key in Admin → AI Settings (or set AI_API_KEY in your environment) to enable AI features.';

const DEFAULT_CONFIG: AIConfig = {
  // Defaults only. Every AI feature works with any of the four providers —
  // pick one and paste your own key in Admin → AI Settings.
  provider: 'anthropic',
  model: 'claude-sonnet-5',
  apiKey: process.env.AI_API_KEY || '',
  prompts: {
    groupAndTags: {
      systemPrompt: `You are an experienced Agile Coach analyzing retrospective feedback.

You will receive retrospective comments organized by section. Each comment has an "id" and a "comment" field.

Group the comments by common themes. For each group, give it a short descriptive title and assign a few keyword tags that capture the essence of the group.

Reference every comment by its exact "id" from the input. Only group comments that genuinely relate to each other — do not force unrelated comments together. If a comment does not fit any group, simply omit it.

Respond ONLY with a JSON object in this shape (no extra text):
{"Title":"<section name>","Groups":[{"Group Title":"<name>","Comments":[{"id":"<original id>","comment":"<original text>"}],"Tags":["tag1","tag2"]}]}

Here is the retrospective data:`,
      temperature: 0.3,
    },
    actions: {
      systemPrompt: `You are an experienced Agile Coach.

Based on the retrospective data provided, suggest exactly 3 concrete action items the team should implement in their next sprint.

Each action item should be specific and assignable — start with who should do it (e.g. "Team Lead", "Product Owner", "Team"). Focus on the most impactful improvements based on the feedback themes. Keep each action item to 1-2 sentences. Only use the retrospective data provided.

Respond ONLY with a JSON object in this shape (no extra text):
{"actionItems":["action 1","action 2","action 3"]}

Here is the retrospective data:`,
      temperature: 0.4,
    },
    patternsAdvice: {
      systemPrompt: `You are an experienced Agile Coach analyzing a completed team retrospective.

Identify exactly 3 recurring patterns or trends visible in the feedback, and provide exactly 3 pieces of advice for improving the team and project.

For each piece of advice, include a brief reason explaining why it matters. Be specific — reference actual themes from the data rather than giving generic advice. Only use the retrospective data provided.

Respond ONLY with a JSON object in this shape (no extra text):
{"patterns":["pattern 1","pattern 2","pattern 3"],"advice":["advice 1","advice 2","advice 3"]}

Here is the retrospective data:`,
      temperature: 0.4,
    },
    improvementAreas: {
      systemPrompt: `You are an experienced Agile Coach analyzing multiple retrospectives over time.

Identify exactly 3 key areas where the team is performing well and exactly 3 key areas where the team needs to improve.

For each area, give it a short label (2-4 words) and a detailed explanation (2-3 sentences) grounded in the retrospective data. Do not reference retrospective IDs in your analysis. Only use the retrospective data provided.

Respond ONLY with a JSON object in this shape (no extra text):
{"strengths":[{"area":"label","description":"explanation"}],"improvements":[{"area":"label","description":"explanation"}]}

Here is the retrospective data:`,
      temperature: 0.4,
    },
  },
};

export async function getAIConfig(): Promise<AIConfig> {
  try {
    await initializeFirebaseAdminApp();
    const firestore = getRestFirestore();
    const doc = await firestore
      .collection(AI_CONFIG_COLLECTION)
      .doc(AI_CONFIG_DOC)
      .get();

    if (!doc.exists) {
      return {
        ...DEFAULT_CONFIG,
        apiKey: process.env.AI_API_KEY || '',
      };
    }

    const data = doc.data() as Partial<AIConfig>;
    return {
      provider: data.provider || DEFAULT_CONFIG.provider,
      model: data.model || DEFAULT_CONFIG.model,
      apiKey: data.apiKey || process.env.AI_API_KEY || '',
      baseURL: data.baseURL || '',
      prompts: {
        groupAndTags: {
          ...DEFAULT_CONFIG.prompts.groupAndTags,
          ...data.prompts?.groupAndTags,
        },
        actions: {
          ...DEFAULT_CONFIG.prompts.actions,
          ...data.prompts?.actions,
        },
        patternsAdvice: {
          ...DEFAULT_CONFIG.prompts.patternsAdvice,
          ...data.prompts?.patternsAdvice,
        },
        improvementAreas: {
          ...DEFAULT_CONFIG.prompts.improvementAreas,
          ...data.prompts?.improvementAreas,
        },
      },
    };
  } catch (error) {
    console.error('Error fetching AI config:', error);
    return {
      ...DEFAULT_CONFIG,
      apiKey: process.env.AI_API_KEY || '',
    };
  }
}

export async function updateAIConfig(
  config: Partial<AIConfig>,
): Promise<void> {
  await initializeFirebaseAdminApp();
  const firestore = getRestFirestore();
  const docRef = firestore
    .collection(AI_CONFIG_COLLECTION)
    .doc(AI_CONFIG_DOC);

  const updateData: Record<string, any> = {};
  if (config.provider) updateData.provider = config.provider;
  if (config.model) updateData.model = config.model;
  if (config.apiKey) updateData.apiKey = config.apiKey;
  if (config.baseURL !== undefined) updateData.baseURL = config.baseURL;
  if (config.prompts) updateData.prompts = config.prompts;
  updateData.updatedAt = new Date();

  await docRef.set(updateData, { merge: true });
}

/**
 * @name isAIConfigured
 * @description Whether an AI provider key is available, either from the admin
 * UI (Firestore) or from the AI_API_KEY environment variable.
 */
export async function isAIConfigured(): Promise<boolean> {
  const config = await getAIConfig();

  // An OpenAI-compatible endpoint may legitimately need no key (e.g. a local
  // Ollama or LM Studio server), so a baseURL is enough for that provider.
  if (config.provider === 'openai-compatible') {
    return Boolean(config.apiKey || config.baseURL);
  }

  return Boolean(config.apiKey);
}

export { DEFAULT_CONFIG };
