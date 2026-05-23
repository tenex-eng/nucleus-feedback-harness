import { describe, expect, it } from 'vitest';
import { DigestSchema } from './schema.js';

const validDigest = {
  period: { start: '2026-01-01T00:00:00.000Z', end: '2026-01-08T00:00:00.000Z' },
  totals: { caseClosure: 1, general: 1, targeted: 1 },
  executiveSummary: 'summary',
  researchFindings: [{
    title: 'Finding',
    affectedWorkflow: 'Case closure',
    painOrNeed: 'Need clearer closure details.',
    severity: 'high',
    confidence: 'medium',
    sourceDiversity: { caseClosure: 1, general: 0, targeted: 1 },
    evidenceIds: ['a'],
    representativeQuotes: [{ id: 'a', quote: 'Short quote' }],
    recommendedNextStep: 'Inspect examples.',
    openQuestions: ['Which tenants are affected?'],
  }],
};

describe('DigestSchema', () => {
  it('validates Research Findings', () => {
    expect(DigestSchema.parse(validDigest)).toMatchObject(validDigest);
  });

  it('caps representative quote length', () => {
    const parsed = DigestSchema.parse({
      ...validDigest,
      researchFindings: [{
        ...validDigest.researchFindings[0],
        representativeQuotes: [{ id: 'a', quote: 'x'.repeat(281) }],
      }],
    });

    expect(parsed.researchFindings[0].representativeQuotes[0].quote).toHaveLength(280);
  });
});
