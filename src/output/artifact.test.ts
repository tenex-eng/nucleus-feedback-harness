import { describe, expect, it } from 'vitest';
import { buildDigestArtifact, DIGEST_ARTIFACT_SCHEMA_VERSION } from './artifact.js';

const digest = {
  period: { start: '2026-05-01T00:00:00.000Z', end: '2026-05-08T00:00:00.000Z' },
  totals: { caseClosure: 99, general: 99, targeted: 99 },
  executiveSummary: 'summary',
  themes: [],
  notableFeedback: [],
};

const stats = {
  total: 3,
  nonEmpty: 2,
  empty: 1,
  sourceCounts: { caseClosure: 1, general: 1, targeted: 1 },
};

describe('buildDigestArtifact', () => {
  it('preserves run metadata and coverage stats', () => {
    expect(buildDigestArtifact({
      digest,
      stats,
      provider: 'vertex',
      model: 'gemini-2.5-flash',
      generatedAt: new Date('2026-05-09T12:00:00.000Z'),
    })).toMatchObject({
      period: digest.period,
      generatedAt: '2026-05-09T12:00:00.000Z',
      provider: 'vertex',
      model: 'gemini-2.5-flash',
      schemaVersion: DIGEST_ARTIFACT_SCHEMA_VERSION,
      promptVersion: expect.any(String),
      coverageStats: stats,
      digest,
    });
  });

  it('includes chunk coverage when provided', () => {
    const chunkCoverage = {
      chunkSize: 2,
      chunkCount: 1,
      nonEmptyCount: 2,
      emptyExcludedCount: 1,
      chunks: [{ index: 0, itemCount: 2, itemIds: ['a', 'b'] }],
    };

    expect(buildDigestArtifact({
      digest,
      stats,
      provider: 'openai',
      model: 'gpt-4.1-mini',
      chunkCoverage,
    }).chunkCoverage).toEqual(chunkCoverage);
  });
});
