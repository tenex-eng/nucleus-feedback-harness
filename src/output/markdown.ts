import type { Digest } from '../agent/schema.js';
import type { FeedbackStats } from '../feedback/stats.js';

export function renderMarkdown(digest: Digest, stats?: FeedbackStats): string {
  const lines: string[] = [];
  lines.push(`# Feedback Digest`);
  lines.push('');
  lines.push(`**Period:** ${digest.period.start} → ${digest.period.end}`);
  lines.push('');
  const totals = stats?.counts ?? digest.totals;
  lines.push(`**Totals:** case closure ${totals.caseClosure}, general ${totals.general}, targeted ${totals.targeted}`);
  if (stats) lines.push(`**Input rows:** ${stats.total}; empty text: ${stats.emptyText}`);
  lines.push('');
  lines.push('## Executive summary');
  lines.push('');
  lines.push(digest.executiveSummary);
  lines.push('');
  lines.push('## Themes');
  lines.push('');
  if (digest.themes.length === 0) lines.push('_No themes._');
  for (const theme of digest.themes) {
    lines.push(`### ${theme.title}`);
    lines.push('');
    lines.push(`- **Category:** ${theme.category}`);
    lines.push(`- **Severity:** ${theme.severity}`);
    lines.push(`- **Count:** ${theme.count}`);
    lines.push(`- **Evidence:** ${theme.evidenceIds.join(', ') || 'none'}`);
    lines.push(`- **Summary:** ${theme.summary}`);
    lines.push(`- **Recommended action:** ${theme.recommendedAction}`);
    lines.push('');
  }
  lines.push('## Notable feedback');
  lines.push('');
  if (digest.notableFeedback.length === 0) lines.push('_No notable feedback._');
  for (const item of digest.notableFeedback) {
    lines.push(`- **${item.id}** (${item.source}): “${item.quote}” — ${item.whyItMatters}`);
  }
  lines.push('');
  return lines.join('\n');
}
