import { fetchFeedback, type QueryOptions } from '../bq/queries.js';
import type { BigQuery } from '@google-cloud/bigquery';
import { computeFeedbackStats, type FeedbackStats } from './stats.js';
import type { FeedbackItem } from './types.js';

export type FeedbackSignalPeriod = { start: Date; end: Date };

export interface FeedbackSignalSource {
  fetch(input: { period: FeedbackSignalPeriod; limit?: number }): Promise<FeedbackItem[]>;
}

export type FeedbackSignalIntake = {
  items: FeedbackItem[];
  stats: FeedbackStats;
};

export async function collectFeedbackSignals(source: FeedbackSignalSource, input: { period: FeedbackSignalPeriod; limit?: number }): Promise<FeedbackSignalIntake> {
  const items = await source.fetch(input);
  return { items, stats: computeFeedbackStats(items) };
}

export function createBigQueryFeedbackSignalSource(client: BigQuery, input: { dataset: QueryOptions['dataset'] }): FeedbackSignalSource {
  return {
    fetch: async ({ period, limit }) => fetchFeedback(client, { dataset: input.dataset, start: period.start, end: period.end, limit }),
  };
}
