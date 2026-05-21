import type { Digest } from '../agent/schema.js';
import type { DigestCompletion } from '../agent/summarize.js';
import type { FeedbackStats } from '../feedback/stats.js';

const MAX_MARKDOWN_QUOTE_LENGTH = 280;

export function renderMarkdown(digest: Digest, stats?: FeedbackStats, completion: DigestCompletion = { status: 'complete' }): string {
  const lines: string[] = [];
  lines.push(`# Feedback Digest`);
  lines.push('');
  if (completion.status === 'incomplete') {
    lines.push('> ⚠️ **Incomplete digest:** some non-empty Feedback Signals failed synthesis after retries. Do not treat this as complete coverage.');
    lines.push('');
  }
  lines.push(`**Period:** ${digest.period.start} → ${digest.period.end}`);
  lines.push('');
  const totals = stats?.sourceCounts ?? digest.totals;
  lines.push(`**Totals:** case closure ${totals.caseClosure}, general ${totals.general}, targeted ${totals.targeted}`);
  if (stats) lines.push(`**Input rows:** ${stats.total}; non-empty text: ${stats.nonEmpty}; empty text: ${stats.empty}`);
  if (completion.status === 'incomplete') {
    lines.push(`**Unsynthesized non-empty signals:** ${completion.unsynthesizedSignalCount}`);
    lines.push(`**Failed chunks:** ${completion.failedChunks.map((chunk) => `#${chunk.index} (${chunk.itemCount} signals)`).join(', ')}`);
  }
  lines.push('');
  lines.push('## Executive summary');
  lines.push('');
  lines.push(digest.executiveSummary);
  lines.push('');
  lines.push('## Research Findings');
  lines.push('');
  if (digest.researchFindings.length === 0) lines.push('_No research findings._');
  for (const finding of digest.researchFindings) {
    lines.push(`### ${finding.title}`);
    lines.push('');
    lines.push(`- **Affected workflow:** ${finding.affectedWorkflow}`);
    lines.push(`- **Pain / need:** ${finding.painOrNeed}`);
    lines.push(`- **Severity:** ${finding.severity}`);
    lines.push(`- **Confidence:** ${finding.confidence}`);
    lines.push(`- **Source diversity:** case closure ${finding.sourceDiversity.caseClosure}, general ${finding.sourceDiversity.general}, targeted ${finding.sourceDiversity.targeted}`);
    lines.push(`- **Evidence:** ${finding.evidenceIds.join(', ') || 'none'}`);
    lines.push(`- **Recommended next step:** ${finding.recommendedNextStep}`);
    if (finding.openQuestions.length > 0) lines.push(`- **Open questions:** ${finding.openQuestions.join('; ')}`);
    lines.push('');
    lines.push('Representative quotes:');
    if (finding.representativeQuotes.length === 0) lines.push('- _None._');
    for (const quote of finding.representativeQuotes) {
      lines.push(`- **${quote.id}:** “${truncate(quote.quote, MAX_MARKDOWN_QUOTE_LENGTH)}”`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}
