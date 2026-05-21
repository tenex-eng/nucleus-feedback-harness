import { describe, expect, it } from 'vitest';
import { computeFeedbackStats } from './stats.js';
import type { FeedbackItem } from './types.js';

const base = { id: 'x', createdAt: '2026-01-01T00:00:00Z', text: 'ok' };

describe('computeFeedbackStats', () => {
  it('computes coverage and source counts', () => {
    const items: FeedbackItem[] = [
      { ...base, id: 'c1', source: 'case_closure', text: 'closed' },
      { ...base, id: 'g1', source: 'general', text: '   ' },
      { ...base, id: 't1', source: 'targeted', text: 'bug' },
      { ...base, id: 't2', source: 'targeted', text: '' },
    ];

    expect(computeFeedbackStats(items)).toEqual({
      total: 4,
      nonEmpty: 2,
      empty: 2,
      sourceCounts: { caseClosure: 1, general: 1, targeted: 2 },
    });
  });
});
