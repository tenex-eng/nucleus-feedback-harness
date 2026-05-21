import { computeFeedbackStats } from '../feedback/stats.js';
import type { FeedbackItem } from '../feedback/types.js';

export const PROMPT_VERSION = '2.0.0';

export function buildDigestPrompt(input: { start: Date; end: Date; items: FeedbackItem[]; chunkIndex?: number; chunkCount?: number }): string {
  const stats = computeFeedbackStats(input.items);
  const items = input.items.filter((item) => item.text.trim().length > 0).map(compactItem);
  const chunkLine = input.chunkIndex == null || input.chunkCount == null ? '' : `Chunk: ${input.chunkIndex + 1} of ${input.chunkCount}\n`;
  return `Summarize Nucleus customer feedback into strict JSON only. No markdown. No prose outside JSON.

Rules:
- Use only provided feedback.
- Produce 3-6 evidence-backed Research Findings, not generic themes.
- Each finding must name affected workflow and user pain/need.
- Severity = impact/urgency: "low" | "medium" | "high".
- Confidence = evidence strength: "low" | "medium" | "high".
- Source diversity counts supporting evidence by source.
- Evidence IDs must be representative IDs from input, max 5 per finding.
- Representative quotes must be direct quotes, max 280 chars each, max 3 per finding.
- Recommended next step must be concrete.
- Include open questions when confidence is low/medium or evidence is ambiguous.
- Empty-text rows were excluded from Feedback JSON. Do not infer satisfaction, intent, or sentiment from empty text.

JSON shape:
{
  "period": { "start": string, "end": string },
  "totals": { "caseClosure": number, "general": number, "targeted": number },
  "executiveSummary": string,
  "researchFindings": [{
    "title": string,
    "affectedWorkflow": string,
    "painOrNeed": string,
    "severity": "low"|"medium"|"high",
    "confidence": "low"|"medium"|"high",
    "sourceDiversity": { "caseClosure": number, "general": number, "targeted": number },
    "evidenceIds": string[],
    "representativeQuotes": [{ "id": string, "quote": string }],
    "recommendedNextStep": string,
    "openQuestions": string[]
  }]
}

Period: ${input.start.toISOString()} to ${input.end.toISOString()}
Queried rows: ${stats.total}
Non-empty text rows: ${stats.nonEmpty}
Empty text rows excluded from prompt: ${stats.empty}
${chunkLine}Prompt rows: ${items.length} non-empty rows
Feedback JSON:
${JSON.stringify(items, null, 2)}`;
}

function compactItem(item: FeedbackItem): FeedbackItem {
  return {
    ...item,
    text: truncate(item.text, 1200),
    suggestedOutput: item.suggestedOutput == null ? undefined : safeTruncateJson(item.suggestedOutput, 1200),
    elementContext: item.elementContext == null ? undefined : safeTruncateJson(item.elementContext, 1200),
  };
}

function safeTruncateJson(value: unknown, max: number): string {
  return truncate(JSON.stringify(value), max);
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max)}…[truncated]`;
}
