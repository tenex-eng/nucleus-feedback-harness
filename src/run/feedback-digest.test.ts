import { describe, expect, it } from 'vitest';
import { runFeedbackDigest, type ArtifactStore, type FeedbackSignalSource } from './feedback-digest.js';
import type { Digest } from '../agent/schema.js';
import type { FeedbackItem } from '../feedback/types.js';
import type { JsonLlmProvider } from '../llm/types.js';

const period = { start: new Date('2026-01-01T00:00:00.000Z'), end: new Date('2026-01-08T00:00:00.000Z') };

const digest: Digest = {
  period: { start: period.start.toISOString(), end: period.end.toISOString() },
  totals: { caseClosure: 0, general: 1, targeted: 0 },
  executiveSummary: 'summary',
  researchFindings: [],
};

const items: FeedbackItem[] = [
  { id: 'g1', source: 'general', createdAt: '2026-01-02T00:00:00.000Z', text: 'helpful' },
  { id: 't1', source: 'targeted', createdAt: '2026-01-03T00:00:00.000Z', text: '', screenshot: { storagePath: 'screenshots/t1.png' } },
];

describe('runFeedbackDigest', () => {
  it('owns Feedback Digest workflow and returns Digest Artifact plus Markdown', async () => {
    const signalSource: FeedbackSignalSource = { fetch: async () => items };
    const llmProvider: JsonLlmProvider = { generateJson: async () => digest };

    const result = await runFeedbackDigest({ period, signalSource, llmProvider, provider: 'openai', model: 'gpt-4.1-mini' });

    expect(result.artifact.coverageStats).toMatchObject({ total: 2, nonEmpty: 1, empty: 1 });
    expect(result.artifact.screenshotReferences).toEqual([{ feedbackId: 't1', source: 'targeted', createdAt: '2026-01-03T00:00:00.000Z', storagePath: 'screenshots/t1.png' }]);
    expect(result.completion).toEqual({ status: 'complete' });
    expect(result.markdown).toContain('# Feedback Digest');
  });

  it('writes through Artifact Store adapter when provided', async () => {
    const writes: unknown[] = [];
    const artifactStore: ArtifactStore = {
      async write(input) {
        writes.push(input);
        return { markdownPath: './digests/weekly.md', jsonPath: './digests/weekly.json' };
      },
    };

    const result = await runFeedbackDigest({
      period,
      signalSource: { fetch: async () => items },
      llmProvider: { generateJson: async () => digest },
      provider: 'vertex',
      model: 'gemini-2.5-flash',
      markdownPath: './digests/weekly.md',
      jsonPath: './digests/weekly.json',
      artifactStore,
    });

    expect(writes).toHaveLength(1);
    expect(result.writtenPaths).toEqual({ markdownPath: './digests/weekly.md', jsonPath: './digests/weekly.json' });
  });
});
