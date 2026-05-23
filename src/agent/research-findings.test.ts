import { describe, expect, it } from 'vitest';
import { mergeResearchFindings, repairResearchFindingSourceDiversity, researchFindingIdentity } from './research-findings.js';
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

  it('merges semantically similar Research Findings with overlapping evidence', () => {
    const merged = mergeResearchFindings([
      finding({ title: 'False positives create tuning burden', affectedWorkflow: 'Detection tuning', painOrNeed: 'Analysts need fewer noisy detections before triage.', evidenceIds: ['a1', 'a2'] }),
      finding({ title: 'Noisy false-positive detections slow analysts', affectedWorkflow: 'Detection tuning', painOrNeed: 'Analysts need lower noise while tuning detections.', evidenceIds: ['a2', 'a3'] }),
    ]);

    expect(merged).toHaveLength(1);
    expect(merged[0].evidenceIds).toEqual(['a1', 'a2', 'a3']);
  });

  it('merges recurring false-positive and AI-disposition categories without shared evidence', () => {
    const merged = mergeResearchFindings([
      finding({ title: 'High Volume of False Positives Requires Extensive Manual Tuning', affectedWorkflow: 'Alert triage', painOrNeed: 'Analysts need less noise.', evidenceIds: ['a1'] }),
      finding({ title: 'False positives and inaccurate alert classification', affectedWorkflow: 'Alert tuning', painOrNeed: 'Analysts need better alert tuning.', evidenceIds: ['a2'] }),
      finding({ title: 'Inaccurate AI-generated dispositions require manual verification', affectedWorkflow: 'Case disposition', painOrNeed: 'Analysts need trustworthy summaries.', evidenceIds: ['b1'] }),
      finding({ title: 'Misleading disposition summaries slow review', affectedWorkflow: 'T1 disposition', painOrNeed: 'Analysts need accurate AI dispositions.', evidenceIds: ['b2'] }),
    ]);

    expect(merged.map((item) => item.evidenceIds)).toEqual([['a1', 'a2'], ['b1', 'b2']]);
  });

  it('merges duplicate Investigate tab query-limit findings', () => {
    const merged = mergeResearchFindings([
      finding({ title: 'Investigate Tab Query Limitations Impede Thorough Analysis', affectedWorkflow: 'Investigate tab', painOrNeed: 'Analysts need robust querying without too many requests errors.', evidenceIds: ['q1'] }),
      finding({ title: 'Investigate Tab Query Limits Impede Deep Dive Analysis', affectedWorkflow: 'Investigate tab queries', painOrNeed: 'Analysts need query rate limits that support investigations.', evidenceIds: ['q2'] }),
    ]);

    expect(merged).toHaveLength(1);
    expect(merged[0].evidenceIds).toEqual(['q1', 'q2']);
  });

  it('computes Source Diversity from canonical evidence IDs instead of model-provided counts', () => {
    const repaired = repairResearchFindingSourceDiversity([
      finding({ sourceDiversity: { caseClosure: 99, general: 99, targeted: 99 }, evidenceIds: ['case-id-1', 'general-', 'targeted-id-1', 'missing'] }),
    ], [
      { id: 'case-id-1', source: 'case_closure', createdAt: '2026-01-01T00:00:00.000Z', text: 'case' },
      { id: 'general-id-1', source: 'general', createdAt: '2026-01-01T00:00:00.000Z', text: 'general' },
      { id: 'targeted-id-1', source: 'targeted', createdAt: '2026-01-01T00:00:00.000Z', text: 'targeted' },
    ]);

    expect(repaired[0].evidenceIds).toEqual(['case-id-1', 'general-id-1', 'targeted-id-1']);
    expect(repaired[0].sourceDiversity).toEqual({ caseClosure: 1, general: 1, targeted: 1 });
  });

  it('limits merged Research Findings to the strongest set', () => {
    const merged = mergeResearchFindings([
      finding({ title: 'Low A', affectedWorkflow: 'Workflow L', painOrNeed: 'Low need.', severity: 'low', evidenceIds: ['l1'] }),
      finding({ title: 'High A', affectedWorkflow: 'Workflow H', painOrNeed: 'High need.', severity: 'high', evidenceIds: ['h1'] }),
      finding({ title: 'Medium A', affectedWorkflow: 'Workflow M', painOrNeed: 'Medium need.', severity: 'medium', evidenceIds: ['m1'] }),
    ], { maxFindings: 2 });

    expect(merged.map((item) => item.title)).toEqual(['High A', 'Medium A']);
  });
});
