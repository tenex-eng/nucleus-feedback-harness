import type { DigestCompletion } from '../agent/summarize.js';
import type { Digest } from '../agent/schema.js';
import { PROMPT_VERSION } from '../agent/prompt.js';
import type { ChunkCoverage } from '../feedback/chunks.js';
import type { FeedbackStats } from '../feedback/stats.js';
import type { LlmProviderName } from '../llm/types.js';

export const DIGEST_ARTIFACT_SCHEMA_VERSION = '1.0.0';

export type DigestArtifact = {
  period: { start: string; end: string };
  generatedAt: string;
  provider: LlmProviderName;
  model: string;
  promptVersion: string;
  schemaVersion: string;
  coverageStats: FeedbackStats;
  chunkCoverage?: ChunkCoverage;
  completion: DigestCompletion;
  digest: Digest;
};

export function buildDigestArtifact(input: {
  digest: Digest;
  stats: FeedbackStats;
  provider: LlmProviderName;
  model: string;
  generatedAt?: Date;
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
    chunkCoverage: input.chunkCoverage,
    completion: input.completion ?? { status: 'complete' },
    digest: input.digest,
  };
}
