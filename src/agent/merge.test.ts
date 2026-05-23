import { describe, expect, it } from 'vitest';
import { mergeChunkDigests } from './merge.js';
import type { Digest, ResearchFinding } from './schema.js';

const finding = (overrides: Partial<ResearchFinding> = {}): ResearchFinding => ({
  title: 'Closure rationale is unclear',
  affectedWorkflow: 'Case closure review',
  painOrNeed: 'Users need clear closure rationale before accepting outcomes.',
  severity: 'medium',
  confidence: 'medium',
  sourceDiversity: { caseClosure: 1, general: 0, targeted: 0 },
  evidenceIds: ['c1'],
  representativeQuotes: [{ id: 'c1', quote: 'I do not understand why this was closed.' }],
  recommendedNextStep: 'Review closure rationale examples.',
  openQuestions: ['Which closure types are affected?'],
  ...overrides,
});

const digest = (overrides: Partial<Digest> = {}): Digest => ({
  period: { start: 'chunk-start', end: 'chunk-end' },
  totals: { caseClosure: 1, general: 0, targeted: 0 },
  executiveSummary: 'chunk summary',
  researchFindings: [finding()],
  ...overrides,
});

describe('mergeChunkDigests', () => {
  it('merges chunk outputs into one final digest with summed processed totals', () => {
    const merged = mergeChunkDigests({
      start: new Date('2026-01-01T00:00:00.000Z'),
      end: new Date('2026-01-08T00:00:00.000Z'),
      digests: [
        digest({ totals: { caseClosure: 1, general: 2, targeted: 0 } }),
        digest({ totals: { caseClosure: 0, general: 1, targeted: 3 }, researchFindings: [finding({ evidenceIds: ['g1'], sourceDiversity: { caseClosure: 0, general: 1, targeted: 0 } })] }),
      ],
    });

    expect(merged.period).toEqual({ start: '2026-01-01T00:00:00.000Z', end: '2026-01-08T00:00:00.000Z' });
    expect(merged.totals).toEqual({ caseClosure: 1, general: 3, targeted: 3 });
  });

  it('consolidates related Research Findings and preserves traceable evidence', () => {
    const longQuote = 'x'.repeat(400);
    const merged = mergeChunkDigests({
      start: new Date('2026-01-01T00:00:00.000Z'),
      end: new Date('2026-01-08T00:00:00.000Z'),
      digests: [
        digest(),
        digest({
          researchFindings: [finding({
            severity: 'high',
            confidence: 'high',
            sourceDiversity: { caseClosure: 0, general: 1, targeted: 1 },
            evidenceIds: ['g1', 't1', 'c1'],
            representativeQuotes: [{ id: 'g1', quote: longQuote }, { id: 't1', quote: 'Button context was wrong.' }],
            openQuestions: ['Does this happen after regeneration?'],
          })],
        }),
      ],
    });

    expect(merged.researchFindings).toHaveLength(1);
    expect(merged.researchFindings[0]).toMatchObject({
      severity: 'high',
      confidence: 'high',
      sourceDiversity: { caseClosure: 1, general: 1, targeted: 1 },
      evidenceIds: ['c1', 'g1', 't1'],
      openQuestions: ['Which closure types are affected?', 'Does this happen after regeneration?'],
    });
    expect(merged.researchFindings[0].representativeQuotes.map((quote) => quote.id)).toEqual(['c1', 'g1', 't1']);
    expect(merged.researchFindings[0].representativeQuotes[1].quote.length).toBe(280);
  });

  it('explains when all chunks failed before producing findings', () => {
    const merged = mergeChunkDigests({
      start: new Date('2026-01-01T00:00:00.000Z'),
      end: new Date('2026-01-08T00:00:00.000Z'),
      digests: [],
      allChunksFailed: true,
    });

    expect(merged.executiveSummary).toBe('No Research Findings were produced because synthesis failed for every non-empty Feedback Signal.');
  });

  it('keeps distinct findings separate', () => {
    const merged = mergeChunkDigests({
      start: new Date('2026-01-01T00:00:00.000Z'),
      end: new Date('2026-01-08T00:00:00.000Z'),
      digests: [digest(), digest({ researchFindings: [finding({ title: 'Search filters fail', affectedWorkflow: 'Search', painOrNeed: 'Users need reliable filtering.', evidenceIds: ['s1'] })] })],
    });

    expect(merged.researchFindings.map((item) => item.title)).toEqual(['Closure rationale is unclear', 'Search filters fail']);
  });

  it('builds one final executive summary from merged findings instead of concatenating chunk summaries', () => {
    const merged = mergeChunkDigests({
      start: new Date('2026-01-01T00:00:00.000Z'),
      end: new Date('2026-01-08T00:00:00.000Z'),
      digests: [digest({ executiveSummary: 'first chunk summary' }), digest({ executiveSummary: 'second chunk summary', researchFindings: [finding({ title: 'Search filters fail', affectedWorkflow: 'Search', painOrNeed: 'Users need reliable filtering.', evidenceIds: ['s1'] })] })],
    });

    expect(merged.executiveSummary).toContain('The strongest patterns are');
    expect(merged.executiveSummary).not.toContain('first chunk summary');
    expect(merged.executiveSummary).not.toContain('second chunk summary');
  });

  it('caps the final digest to seven strongest Research Findings by default', () => {
    const merged = mergeChunkDigests({
      start: new Date('2026-01-01T00:00:00.000Z'),
      end: new Date('2026-01-08T00:00:00.000Z'),
      digests: [digest({ researchFindings: Array.from({ length: 9 }, (_, index) => finding({ title: `Finding ${index}`, affectedWorkflow: `Workflow ${index}`, painOrNeed: `Need ${index} requires specific remediation.`, evidenceIds: [`e${index}`] })) })],
    });

    expect(merged.researchFindings).toHaveLength(7);
  });
});
