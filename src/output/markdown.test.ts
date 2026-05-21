import { describe, expect, it } from 'vitest';
import { renderMarkdown } from './markdown.js';

const digest = {
  period: { start: 's', end: 'e' },
  totals: { caseClosure: 0, general: 0, targeted: 0 },
  executiveSummary: 'summary',
  themes: [{ title: 'Theme', category: 'bug' as const, severity: 'high' as const, count: 2, evidenceIds: ['a'], summary: 'bad', recommendedAction: 'fix' }],
  notableFeedback: [{ id: 'a', source: 'targeted' as const, quote: 'quote', whyItMatters: 'matters' }],
};

describe('renderMarkdown', () => {
  it('uses computed stats when provided', () => {
    const md = renderMarkdown(digest, { total: 3, emptyText: 1, counts: { caseClosure: 1, general: 1, targeted: 1 } });
    expect(md).toContain('case closure 1, general 1, targeted 1');
    expect(md).toContain('**Input rows:** 3; empty text: 1');
    expect(md).toContain('### Theme');
  });
});
