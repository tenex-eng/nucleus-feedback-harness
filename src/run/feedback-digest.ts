import type { DigestCompletion } from '../agent/summarize.js';
import { summarizeFeedback } from '../agent/summarize.js';
import type { DigestArtifact } from '../output/artifact.js';
import { createDigestArtifactView } from '../output/artifact.js';
import { computeFeedbackStats } from '../feedback/stats.js';
import type { FeedbackItem } from '../feedback/types.js';
import type { JsonLlmProvider, LlmProviderName } from '../llm/types.js';

export type FeedbackDigestPeriod = { start: Date; end: Date };

export interface FeedbackSignalSource {
  fetch(input: { period: FeedbackDigestPeriod; limit?: number }): Promise<FeedbackItem[]>;
}

export interface ArtifactStore {
  write(input: { artifact: DigestArtifact; markdown: string; end: Date; markdownPath?: string; jsonPath?: string }): Promise<{ markdownPath: string; jsonPath?: string }>;
}

export type RunFeedbackDigestInput = {
  period: FeedbackDigestPeriod;
  signalSource: FeedbackSignalSource;
  llmProvider: JsonLlmProvider;
  provider: LlmProviderName;
  model: string;
  limit?: number;
  markdownPath?: string;
  jsonPath?: string;
  artifactStore?: ArtifactStore;
};

export type RunFeedbackDigestResult = {
  artifact: DigestArtifact;
  markdown: string;
  completion: DigestCompletion;
  writtenPaths?: { markdownPath: string; jsonPath?: string };
};

export async function runFeedbackDigest(input: RunFeedbackDigestInput): Promise<RunFeedbackDigestResult> {
  const items = await input.signalSource.fetch({ period: input.period, limit: input.limit });
  const stats = computeFeedbackStats(items);
  const { digest, chunkCoverage, completion } = await summarizeFeedback(input.llmProvider, {
    start: input.period.start,
    end: input.period.end,
    items,
  });
  const { artifact, markdown } = createDigestArtifactView({
    digest,
    stats,
    provider: input.provider,
    model: input.model,
    items,
    chunkCoverage,
    completion,
  });
  const writtenPaths = input.artifactStore == null ? undefined : await input.artifactStore.write({
    artifact,
    markdown,
    end: input.period.end,
    markdownPath: input.markdownPath,
    jsonPath: input.jsonPath,
  });
  return { artifact, markdown, completion, writtenPaths };
}
