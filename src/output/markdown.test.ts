import { describe, expect, it } from 'vitest';
import { renderMarkdown } from './markdown.js';

const digest = {
  period: { start: 's', end: 'e' },
  totals: { caseClosure: 0, general: 0, targeted: 0 },
  executiveSummary: 'summary',
  researchFindings: [{
    title: 'Case review is unclear',
    affectedWorkflow: 'Case closure review',
    painOrNeed: 'Users need clearer rationale before accepting closure.',
    severity: 'high' as const,
    confidence: 'medium' as const,
    sourceDiversity: { caseClosure: 1, general: 0, targeted: 1 },
    evidenceIds: ['a', 'b'],
    representativeQuotes: [{ id: 'a', quote: 'The closure reason was vague.' }],
    recommendedNextStep: 'Audit closure rationale examples.',
    openQuestions: ['Does this happen for all tenants?'],
  }],
};

describe('renderMarkdown', () => {
  it('renders Research Findings and computed stats', () => {
    const md = renderMarkdown(digest, { total: 3, nonEmpty: 2, empty: 1, sourceCounts: { caseClosure: 1, general: 1, targeted: 1 } });
    expect(md).toContain('## Research Findings');
    expect(md).toContain('### Case review is unclear');
    expect(md).toContain('**Affected workflow:** Case closure review');
    expect(md).toContain('**Pain / need:** Users need clearer rationale before accepting closure.');
    expect(md).toContain('**Source diversity:** case closure 1, general 0, targeted 1');
    expect(md).toContain('**a:** “The closure reason was vague.”');
    expect(md).toContain('**Input rows:** 3; non-empty text: 2; empty text: 1');
  });
});
