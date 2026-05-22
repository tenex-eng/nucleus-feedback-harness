import type { Digest } from '../agent/schema.js';
import type { DigestCompletion } from '../agent/summarize.js';
import type { FeedbackStats } from '../feedback/stats.js';
import { renderDigestArtifactMarkdown } from './digest-artifact.js';

/** @deprecated Prefer createDigestArtifactView so JSON and Markdown share completion semantics. */
export function renderMarkdown(digest: Digest, stats?: FeedbackStats, completion: DigestCompletion = { status: 'complete' }): string {
  const coverageStats = stats ?? {
    total: digest.totals.caseClosure + digest.totals.general + digest.totals.targeted,
    nonEmpty: digest.totals.caseClosure + digest.totals.general + digest.totals.targeted,
    empty: 0,
    sourceCounts: digest.totals,
    screenshotCoverage: {
      withScreenshot: { caseClosure: 0, general: 0, targeted: 0 },
      withoutScreenshot: digest.totals,
    },
  };
  return renderDigestArtifactMarkdown({
    period: digest.period,
    generatedAt: new Date(0).toISOString(),
    provider: 'openai',
    model: 'markdown-only',
    promptVersion: 'markdown-only',
    schemaVersion: 'markdown-only',
    coverageStats,
    screenshotReferences: [],
    completion,
    digest,
  });
}
