import type { DigestCompletion } from '../agent/summarize.js';
import type { Digest } from '../agent/schema.js';
import { PROMPT_VERSION } from '../agent/prompt.js';
import type { ChunkCoverage } from '../feedback/chunks.js';
import type { FeedbackStats } from '../feedback/stats.js';
import type { FeedbackItem, FeedbackSource } from '../feedback/types.js';
import type { LlmProviderName } from '../llm/types.js';

export const DIGEST_ARTIFACT_SCHEMA_VERSION = '1.1.0';
const MAX_MARKDOWN_QUOTE_LENGTH = 280;

export type ScreenshotReference = {
  feedbackId: string;
  source: FeedbackSource;
  createdAt: string;
  storagePath: string;
};

export type DigestArtifact = {
  period: { start: string; end: string };
  generatedAt: string;
  provider: LlmProviderName;
  model: string;
  promptVersion: string;
  schemaVersion: string;
  coverageStats: FeedbackStats;
  screenshotReferences: ScreenshotReference[];
  chunkCoverage?: ChunkCoverage;
  completion: DigestCompletion;
  digest: Digest;
};

export type DigestArtifactView = {
  artifact: DigestArtifact;
  markdown: string;
};

export function createDigestArtifactView(input: {
  digest: Digest;
  stats: FeedbackStats;
  provider: LlmProviderName;
  model: string;
  generatedAt?: Date;
  items?: FeedbackItem[];
  chunkCoverage?: ChunkCoverage;
  completion?: DigestCompletion;
}): DigestArtifactView {
  const artifact = buildDigestArtifact(input);
  return { artifact, markdown: renderDigestArtifactMarkdown(artifact) };
}

export function buildDigestArtifact(input: {
  digest: Digest;
  stats: FeedbackStats;
  provider: LlmProviderName;
  model: string;
  generatedAt?: Date;
  items?: FeedbackItem[];
  chunkCoverage?: ChunkCoverage;
  completion?: DigestCompletion;
}): DigestArtifact {
  return {
    period: input.digest.period,
    generatedAt: (input.generatedAt ?? new Date()).toISOString(),
    provider: input.provider,
    model: input.model,
    promptVersion: PROMPT_VERSION,
    schemaVersion: DIGEST_ARTIFACT_SCHEMA_VERSION,
    coverageStats: input.stats,
    screenshotReferences: buildScreenshotReferences(input.items ?? []),
    chunkCoverage: input.chunkCoverage,
    completion: input.completion ?? { status: 'complete' },
    digest: input.digest,
  };
}

export function renderDigestArtifactMarkdown(artifact: DigestArtifact): string {
  const { digest, coverageStats: stats, completion } = artifact;
  const lines: string[] = [];
  lines.push(`# Feedback Digest`);
  lines.push('');
  if (completion.status === 'incomplete') {
    lines.push('> ⚠️ **Incomplete digest:** some non-empty Feedback Signals failed synthesis after retries. Do not treat this as complete coverage.');
    lines.push('');
  }
  lines.push(`**Period:** ${digest.period.start} → ${digest.period.end}`);
  lines.push('');
  const totals = stats.sourceCounts;
  lines.push(`**Totals:** case closure ${totals.caseClosure}, general ${totals.general}, targeted ${totals.targeted}`);
  lines.push(`**Input rows:** ${stats.total}; non-empty text: ${stats.nonEmpty}; empty text: ${stats.empty}`);
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
    lines.push(`**Severity:** ${finding.severity} · **Confidence:** ${finding.confidence}  `);
    lines.push(`**Workflow:** ${finding.affectedWorkflow}  `);
    lines.push(`**Source diversity:** case closure ${finding.sourceDiversity.caseClosure}, general ${finding.sourceDiversity.general}, targeted ${finding.sourceDiversity.targeted}`);
    lines.push('');
    lines.push('**Pain / need**');
    lines.push('');
    lines.push(finding.painOrNeed);
    lines.push('');
    lines.push('**Recommended next step**');
    lines.push('');
    lines.push(finding.recommendedNextStep);
    lines.push('');
    if (finding.openQuestions.length > 0) {
      lines.push('**Open questions**');
      lines.push('');
      for (const question of finding.openQuestions) lines.push(`- ${question}`);
      lines.push('');
    }
    lines.push(`**Evidence IDs (${finding.evidenceIds.length})**`);
    lines.push('');
    lines.push(finding.evidenceIds.length === 0 ? '_None._' : finding.evidenceIds.map((id) => `\`${id}\``).join(', '));
    lines.push('');
    lines.push('**Representative quotes**');
    lines.push('');
    if (finding.representativeQuotes.length === 0) lines.push('- _None._');
    for (const quote of finding.representativeQuotes) {
      lines.push(`- **${quote.id}:** “${truncate(quote.quote, MAX_MARKDOWN_QUOTE_LENGTH)}”`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

function buildScreenshotReferences(items: FeedbackItem[]): ScreenshotReference[] {
  return items
    .filter((item) => item.screenshot != null)
    .map((item) => ({
      feedbackId: item.id,
      source: item.source,
      createdAt: item.createdAt,
      storagePath: item.screenshot?.storagePath ?? '',
    }));
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}
