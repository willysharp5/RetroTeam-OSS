/**
 * Transforms raw AI text responses into the structured JSON
 * formats the frontend expects. This decouples AI output from
 * the frontend contract — prompts focus on analysis quality
 * while this layer handles the formatting.
 */

function extractJSON(text: string): any {
  let cleaned = text.trim();

  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');

  if (firstBrace !== -1 && lastBrace > firstBrace) {
    if (firstBracket === -1 || firstBrace < firstBracket) {
      try {
        return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
      } catch {
        // fall through to next strategy
      }
    }
  }

  if (firstBracket !== -1 && lastBracket > firstBracket) {
    try {
      return JSON.parse(cleaned.substring(firstBracket, lastBracket + 1));
    } catch {
      // fall through
    }
  }

  // Try increasingly aggressive extraction — scan for the deepest valid JSON
  if (firstBrace !== -1) {
    let braceDepth = 0;
    let start = -1;
    for (let i = 0; i < cleaned.length; i++) {
      if (cleaned[i] === '{') {
        if (braceDepth === 0) start = i;
        braceDepth++;
      } else if (cleaned[i] === '}') {
        braceDepth--;
        if (braceDepth === 0 && start !== -1) {
          try {
            return JSON.parse(cleaned.substring(start, i + 1));
          } catch {
            start = -1;
          }
        }
      }
    }
  }

  return JSON.parse(cleaned);
}

/**
 * groupAndTags: AI returns groups with titles, comment IDs, and tags.
 * Frontend expects:
 * {
 *   Title: string,
 *   Groups: [{ "Group Title": string, Comments: [{id, comment}], Tags: string[] }]
 * }
 */
export function parseGroupAndTags(
  rawText: string,
  sectionTitle: string,
  originalComments: { id: string; comment: string }[],
): any {
  try {
    const parsed = extractJSON(rawText);

    if (parsed.Title && Array.isArray(parsed.Groups)) {
      const validGroups = parsed.Groups.every(
        (g: any) => g['Group Title'] && Array.isArray(g.Comments),
      );
      if (validGroups) return parsed;
    }

    const groups: any[] = [];

    const rawGroups = parsed.groups || parsed.Groups || [];
    const groupArray = Array.isArray(rawGroups) ? rawGroups : [];

    for (const g of groupArray) {
      const title =
        g['Group Title'] || g.group_title || g.title || g.name || 'Untitled';
      const tags = g.Tags || g.tags || [];

      let comments: { id: string; comment: string }[] = [];
      const rawComments = g.Comments || g.comments || g.items || [];

      if (Array.isArray(rawComments)) {
        comments = rawComments
          .map((c: any): { id: string; comment: string } | null => {
            if (typeof c === 'string') {
              const match = originalComments.find(
                (oc) => oc.id === c || oc.comment === c,
              );
              return match || null;
            }
            const id = c.id || c.comment_id;
            const comment =
              c.comment || c.text || c.description || '';
            if (id) return { id, comment };
            return null;
          })
          .filter((c): c is { id: string; comment: string } => c !== null);
      }

      if (comments.length > 0) {
        groups.push({
          'Group Title': String(title),
          Comments: comments,
          Tags: Array.isArray(tags) ? tags.map(String) : [],
        });
      }
    }

    return {
      Title: parsed.Title || parsed.title || sectionTitle,
      Groups: groups,
    };
  } catch (error) {
    console.error('parseGroupAndTags failed:', error);
    return { Title: sectionTitle, Groups: [] };
  }
}

/**
 * actions: AI returns action items.
 * Frontend expects: { actionItems: string[] }
 */
export function parseActions(rawText: string): any {
  try {
    const parsed = extractJSON(rawText);

    const items =
      parsed.actionItems ||
      parsed.ActionItems ||
      parsed.Actions ||
      parsed.action_items ||
      parsed.actions;

    if (Array.isArray(items)) {
      return { actionItems: items.map(String).slice(0, 3) };
    }

    if (Array.isArray(parsed)) {
      return { actionItems: parsed.map(String).slice(0, 3) };
    }

    return { actionItems: [] };
  } catch {
    const lines = rawText
      .split('\n')
      .map((l) => l.replace(/^\d+[\.\)]\s*/, '').trim())
      .filter((l) => l.length > 10);

    return { actionItems: lines.slice(0, 3) };
  }
}

/**
 * patternsAdvice: AI returns patterns + advice in flexible format.
 * Frontend expects:
 * {
 *   "Patterns and Trends Identified": string[],
 *   "Advice for Improving the Team and Project": string[]
 * }
 */
export function parsePatternsAdvice(rawText: string): any {
  try {
    const parsed = extractJSON(rawText);

    const patterns =
      parsed['Patterns and Trends Identified'] ||
      parsed.patterns ||
      parsed.Patterns ||
      parsed.patterns_and_trends ||
      parsed.trends ||
      [];
    const advice =
      parsed['Advice for Improving the Team and Project'] ||
      parsed.advice ||
      parsed.Advice ||
      parsed.recommendations ||
      parsed.Recommendations ||
      [];

    function toStringArray(arr: any): string[] {
      if (!Array.isArray(arr)) return [];
      return arr.map((item: any) => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object') {
          return item.description || item.detail || item.text || item.recommendation || JSON.stringify(item);
        }
        return String(item);
      }).slice(0, 3);
    }

    return {
      'Patterns and Trends Identified': toStringArray(patterns),
      'Advice for Improving the Team and Project': toStringArray(advice),
    };
  } catch {
    return {
      'Patterns and Trends Identified': [],
      'Advice for Improving the Team and Project': [],
    };
  }
}

/**
 * improvementAreas: AI returns strengths + improvements in flexible format.
 * Frontend expects:
 * {
 *   "3 key areas the team is performing well": { AreaName: "description", ... },
 *   "3 key areas the team needs to improve": { AreaName: "description", ... }
 * }
 */
export function parseImprovementAreas(rawText: string): any {
  try {
    const parsed = extractJSON(rawText);

    function findKey(obj: any, keywords: string[]): any {
      const key = Object.keys(obj).find((k) =>
        keywords.some((kw) => k.toLowerCase().includes(kw)),
      );
      return key ? obj[key] : undefined;
    }

    const performingWell =
      findKey(parsed, ['performing well', 'strengths', 'doing well', 'excelling']) ||
      parsed.strengths ||
      {};
    const needsImprovement =
      findKey(parsed, ['needs to improve', 'improvements', 'weaknesses', 'areas for improvement']) ||
      parsed.improvements ||
      {};

    function normalizeAreas(data: any): Record<string, string> {
      if (!data || typeof data !== 'object') return {};

      if (Array.isArray(data)) {
        const result: Record<string, string> = {};
        data.slice(0, 3).forEach((item: any, i: number) => {
          if (typeof item === 'string') {
            result[`Area ${i + 1}`] = item;
          } else if (typeof item === 'object') {
            const key = item.area || item.name || item.title || `Area ${i + 1}`;
            const val = item.description || item.detail || item.explanation || JSON.stringify(item);
            result[String(key)] = String(val);
          }
        });
        return result;
      }

      const result: Record<string, string> = {};
      const entries = Object.entries(data).slice(0, 3);
      for (const [k, v] of entries) {
        result[String(k)] = typeof v === 'string' ? v : JSON.stringify(v);
      }
      return result;
    }

    return {
      '3 key areas the team is performing well': normalizeAreas(performingWell),
      '3 key areas the team needs to improve': normalizeAreas(needsImprovement),
    };
  } catch {
    return {
      '3 key areas the team is performing well': {},
      '3 key areas the team needs to improve': {},
    };
  }
}
