import type { FeedbackItem } from './types.js';

export type SourceCounts = { caseClosure: number; general: number; targeted: number };

export type FeedbackStats = {
  total: number;
  nonEmpty: number;
  empty: number;
  sourceCounts: SourceCounts;
};

export function computeFeedbackStats(items: FeedbackItem[]): FeedbackStats {
  const empty = items.filter((i) => i.text.trim().length === 0).length;
  return {
    total: items.length,
    nonEmpty: items.length - empty,
    empty,
    sourceCounts: {
      caseClosure: items.filter((i) => i.source === 'case_closure').length,
      general: items.filter((i) => i.source === 'general').length,
      targeted: items.filter((i) => i.source === 'targeted').length,
    },
  };
}
