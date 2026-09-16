import { wordCounter } from '~/lib/ai/word-counter';
import { callAI } from './call-ai';
import { parsePatternsAdvice } from './response-parser';

export async function getPatternsAdviceFromAI(
  comments: any,
  retrospective: any,
  totalAiTokens: number,
): Promise<any> {
  const data: Record<string, string[]> = {};

  retrospective.structure.forEach((structure: any) => {
    data[structure.name] = [];
  });

  comments.forEach((comment: any) => {
    const structureName = retrospective.structure.find(
      (structure: any) => structure.id === comment.status,
    )?.name;

    if (structureName) {
      const cleanedDescription = comment.description.replace(/[\n\\]/g, ' ');
      data[structureName].push(cleanedDescription);
    }
  });

  const aiWordCount: number = wordCounter(JSON.stringify(data));
  if (aiWordCount > totalAiTokens) {
    return {
      error: {
        error: true,
        message: 'This data is too large for our AI to Analyze',
      },
    };
  }

  try {
    const responseText = await callAI(
      'patternsAdvice',
      JSON.stringify({ question: data }),
    );

    const parsed = parsePatternsAdvice(responseText);
    return [parsed];
  } catch (error) {
    console.error('Error processing AI patterns response:', error);
    throw error;
  }
}
