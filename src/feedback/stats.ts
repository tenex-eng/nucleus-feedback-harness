import type { FeedbackItem } from './types.js';

export type FeedbackStats = {
  total: number;
  counts: { caseClosure: number; general: number; targeted: number };
  emptyText: number;
};

export function computeFeedbackStats(items: FeedbackItem[]): FeedbackStats {
  return {
    total: items.length,
    counts: {
      caseClosure: items.filter((i) => i.source === 'case_closure').length,
      general: items.filter((i) => i.source === 'general').length,
      targeted: items.filter((i) => i.source === 'targeted').length,
    },
    emptyText: items.filter((i) => i.text.trim().length === 0).length,
  };
}
