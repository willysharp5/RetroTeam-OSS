import { wordCounter } from '~/lib/ai/word-counter';
import { callAI } from './call-ai';
import { parseImprovementAreas } from './response-parser';

export async function getImprovementAreasProjectManagerAI(
  retrospectives: any,
  totalAiTokens: number,
) {
  const Retrospectives: any[] = [];

  retrospectives.forEach((retrospective: any) => {
    const data: Record<string, any> = {};

    retrospective.structure.forEach((structure: any) => {
      data[structure.name] = [];
    });

    retrospective.comments.forEach((comment: any) => {
      const structureName = retrospective.structure.find(
        (structure: any) => structure.id === comment.status,
      )?.name;
      if (structureName) {
        data[structureName].push(comment.description);
      }
    });
    data.RetrospectiveID = retrospective.id;
    Retrospectives.push(data);
  });

  const payload = {
    question: {
      Retrospectives,
    },
  };

  const aiTokenCount: number = wordCounter(JSON.stringify(payload));

  if (aiTokenCount > totalAiTokens) {
    return {
      error: {
        error: true,
        message:
          'This data is too large for our AI to Analyze, please select a smaller range of dates',
      },
    };
  }

  try {
    const responseText = await callAI(
      'improvementAreas',
      JSON.stringify(payload),
    );

    const parsed = parseImprovementAreas(responseText);
    return [parsed];
  } catch (error) {
    console.error('Error processing AI improvement areas response:', error);
    return undefined;
  }
}
