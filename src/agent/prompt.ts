import { computeFeedbackStats } from '../feedback/stats.js';
import type { FeedbackItem } from '../feedback/types.js';

export function buildDigestPrompt(input: { start: Date; end: Date; items: FeedbackItem[]; maxItems?: number }): string {
  const maxItems = input.maxItems ?? 200;
  const stats = computeFeedbackStats(input.items);
  const nonEmptyItems = input.items.filter((item) => item.text.trim().length > 0);
  const items = nonEmptyItems.slice(0, maxItems).map(compactItem);
  return `Summarize Nucleus customer feedback into strict JSON only. No markdown. No prose outside JSON.

Rules:
- Use only provided feedback.
- Cluster repeated issues into 3-6 actionable themes.
- Prefer actionable product/AI quality themes over generic positive feedback.
- Include at most one positive theme, only if strongly recurring.
- Evidence IDs must be representative IDs from input, max 5 per theme.
- Theme count = count of provided prompt items supporting the theme, not the full database population.
- Prefer concrete recommended actions.
- If little data, say so in executiveSummary and keep arrays short.
- Empty-text rows were excluded from Feedback JSON. Do not infer satisfaction, intent, or sentiment from empty text.
- Notable feedback quotes must be <= 400 chars.

JSON shape:
{
  "period": { "start": string, "end": string },
  "totals": { "caseClosure": number, "general": number, "targeted": number },
  "executiveSummary": string,
  "themes": [{ "title": string, "category": "bug"|"ux"|"ai_quality"|"feature"|"case_quality"|"other", "severity": "low"|"medium"|"high", "count": number, "evidenceIds": string[], "summary": string, "recommendedAction": string }],
  "notableFeedback": [{ "id": string, "source": "case_closure"|"general"|"targeted", "quote": string, "whyItMatters": string }]
}

Period: ${input.start.toISOString()} to ${input.end.toISOString()}
Queried rows: ${stats.total}
Non-empty text rows: ${stats.total - stats.emptyText}
Empty text rows excluded from prompt: ${stats.emptyText}
Prompt sample: ${items.length} most recent non-empty rows
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
