import { wordCounter } from '~/lib/ai/word-counter';
import { callAI } from './call-ai';
import { parseActions } from './response-parser';

export async function getActionsAI(
  comments: any,
  retrospectiveData: any,
  totalAiTokens: number,
) {
  const question: Record<string, string[]> = {};

  comments.forEach((comment: any) => {
    const status = retrospectiveData.structure.find(
      (status: any) => status.id === comment.status,
    );

    if (status) {
      if (!question[status.name]) {
        question[status.name] = [];
      }
      question[status.name].push(comment.description);
    }
  });

  const payload = { question };
  const aiTokenWords: number = wordCounter(JSON.stringify(payload));

  if (aiTokenWords > totalAiTokens) {
    return {
      error: {
        error: true,
        message: 'This data is too large for our AI to Analyze',
      },
    };
  }

  try {
    const responseText = await callAI('actions', JSON.stringify(payload));
    const parsed = parseActions(responseText);
    return [parsed];
  } catch (error) {
    console.error('Error processing AI actions response:', error);
    return undefined;
  }
}
