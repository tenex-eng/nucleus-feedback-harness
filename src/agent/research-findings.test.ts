import { describe, expect, it } from 'vitest';
import { mergeResearchFindings, researchFindingIdentity } from './research-findings.js';
import type { ResearchFinding } from './schema.js';

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

describe('researchFindingIdentity', () => {
  it('normalizes title, affected workflow, and pain or need', () => {
    expect(researchFindingIdentity(finding())).toBe(researchFindingIdentity(finding({
      title: 'Closure: rationale is unclear!',
      affectedWorkflow: 'Case closure review',
      painOrNeed: 'Users need clear closure rationale before accepting outcomes.',
    })));
  });
});

describe('mergeResearchFindings', () => {
  it('consolidates related Research Findings and preserves evidence rules', () => {
    const merged = mergeResearchFindings([
      finding(),
      finding({
        severity: 'high',
        confidence: 'high',
        sourceDiversity: { caseClosure: 0, general: 1, targeted: 1 },
        evidenceIds: ['g1', 't1', 'c1'],
        representativeQuotes: [
          { id: 'g1', quote: 'x'.repeat(400) },
          { id: 't1', quote: 'Button context was wrong.' },
          { id: 'extra', quote: 'Extra quote should be capped out.' },
        ],
        openQuestions: ['Does this happen after regeneration?'],
      }),
    ]);

    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({
      severity: 'high',
      confidence: 'high',
      sourceDiversity: { caseClosure: 1, general: 1, targeted: 1 },
      evidenceIds: ['c1', 'g1', 't1'],
      openQuestions: ['Which closure types are affected?', 'Does this happen after regeneration?'],
    });
    expect(merged[0].representativeQuotes).toHaveLength(3);
    expect(merged[0].representativeQuotes[1].quote.length).toBe(280);
  });
});
