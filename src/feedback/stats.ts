import type { FeedbackItem } from './types.js';

export type SourceCounts = { caseClosure: number; general: number; targeted: number };

export type ScreenshotCoverage = {
  withScreenshot: SourceCounts;
  withoutScreenshot: SourceCounts;
};

export type FeedbackStats = {
  total: number;
  nonEmpty: number;
  empty: number;
  sourceCounts: SourceCounts;
  screenshotCoverage: ScreenshotCoverage;
};

export function computeFeedbackStats(items: FeedbackItem[]): FeedbackStats {
  const empty = items.filter((i) => i.text.trim().length === 0).length;
  const sourceCounts = countBySource(items);
  const withScreenshot = countBySource(items.filter((i) => i.screenshot != null));
  return {
    total: items.length,
    nonEmpty: items.length - empty,
    empty,
    sourceCounts,
    screenshotCoverage: {
      withScreenshot,
      withoutScreenshot: {
        caseClosure: sourceCounts.caseClosure - withScreenshot.caseClosure,
        general: sourceCounts.general - withScreenshot.general,
        targeted: sourceCounts.targeted - withScreenshot.targeted,
      },
    },
  };
}

function countBySource(items: FeedbackItem[]): SourceCounts {
  return {
    caseClosure: items.filter((i) => i.source === 'case_closure').length,
    general: items.filter((i) => i.source === 'general').length,
    targeted: items.filter((i) => i.source === 'targeted').length,
  };
}
