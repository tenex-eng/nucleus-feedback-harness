import { describe, expect, it } from 'vitest';
import { buildDigestArtifact, DIGEST_ARTIFACT_SCHEMA_VERSION } from './artifact.js';

const digest = {
  period: { start: '2026-05-01T00:00:00.000Z', end: '2026-05-08T00:00:00.000Z' },
  totals: { caseClosure: 99, general: 99, targeted: 99 },
  executiveSummary: 'summary',
  researchFindings: [],
};

const stats = {
  total: 3,
  nonEmpty: 2,
  empty: 1,
  sourceCounts: { caseClosure: 1, general: 1, targeted: 1 },
  screenshotCoverage: {
    withScreenshot: { caseClosure: 0, general: 1, targeted: 1 },
    withoutScreenshot: { caseClosure: 1, general: 0, targeted: 0 },
  },
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
      screenshotReferences: [],
      completion: { status: 'complete' },
      digest,
    });
  });

  it('includes screenshot references when items are provided', () => {
    expect(buildDigestArtifact({
      digest,
      stats,
      provider: 'vertex',
      model: 'gemini-2.5-flash',
      items: [
        { id: 'g1', source: 'general', createdAt: '2026-05-02T00:00:00.000Z', text: 'bug', screenshot: { storagePath: 'universal-feedback/t/g1/screenshot.jpg' } },
        { id: 't1', source: 'targeted', createdAt: '2026-05-03T00:00:00.000Z', text: 'bug' },
      ],
    }).screenshotReferences).toEqual([{ feedbackId: 'g1', source: 'general', createdAt: '2026-05-02T00:00:00.000Z', storagePath: 'universal-feedback/t/g1/screenshot.jpg' }]);
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

  it('preserves incomplete completion metadata', () => {
    const completion = {
      status: 'incomplete' as const,
      unsynthesizedSignalCount: 2,
      failedChunks: [{ index: 1, itemCount: 2, itemIds: ['x', 'y'], error: 'provider down' }],
    };

    expect(buildDigestArtifact({
      digest,
      stats,
      provider: 'openai',
      model: 'gpt-4.1-mini',
      completion,
    }).completion).toEqual(completion);
  });
});
