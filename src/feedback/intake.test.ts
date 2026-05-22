import { describe, expect, it } from 'vitest';
import { collectFeedbackSignals, type FeedbackSignalSource } from './intake.js';
import type { FeedbackItem } from './types.js';

const items: FeedbackItem[] = [
  { id: 'c1', source: 'case_closure', createdAt: '2026-01-01T00:00:00.000Z', text: 'closed' },
  { id: 'g1', source: 'general', createdAt: '2026-01-02T00:00:00.000Z', text: '' },
];

describe('collectFeedbackSignals', () => {
  it('collects Feedback Signals and computes coverage stats at the intake seam', async () => {
    const source: FeedbackSignalSource = { fetch: async () => items };

    const intake = await collectFeedbackSignals(source, { period: { start: new Date('2026-01-01'), end: new Date('2026-01-08') } });

    expect(intake.items).toEqual(items);
    expect(intake.stats).toMatchObject({
      total: 2,
      nonEmpty: 1,
      empty: 1,
      sourceCounts: { caseClosure: 1, general: 1, targeted: 0 },
    });
  });
});
