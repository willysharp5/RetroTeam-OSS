import { wordCounter } from '~/lib/ai/word-counter';
import { callAI } from './call-ai';
import { parseGroupAndTags } from './response-parser';

export async function GenerateAIGroupAndTags(
  comments: any,
  retrospective: any,
  totalAiTokens: number,
) {
  const data: Record<string, any[]> = {};

  retrospective.structure.forEach((structure: any) => {
    data[structure.name] = [];
  });

  comments.forEach((comment: any) => {
    const structureName = retrospective.structure.find(
      (structure: any) => structure.id === comment.status,
    )?.name;
    if (structureName) {
      data[structureName].push({
        id: comment.id,
        comment: comment.description,
      });
    }
  });

  const aiTokenWords: number = wordCounter(JSON.stringify(data));

  if (aiTokenWords > totalAiTokens) {
    return {
      error: {
        error: true,
        message: 'This data is too large for our AI to Analyze',
      },
    };
  }

  const promises = Object.keys(data).map(async (key) => {
    const payload = { [key]: data[key] };
    const responseText = await callAI(
      'groupAndTags',
      JSON.stringify(payload),
    );

    return parseGroupAndTags(responseText, key, data[key]);
  });

  const responses = await Promise.all(promises);
  return responses.filter(
    (r) => r && Array.isArray(r.Groups) && r.Groups.length > 0,
  );
}
