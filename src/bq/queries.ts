import type { BigQuery } from '@google-cloud/bigquery';
import type { FeedbackItem } from '../feedback/types.js';
import { normalizeCaseClosureRow, normalizeUniversalRow } from '../feedback/normalize.js';

export type QueryOptions = {
  dataset: string;
  start: Date;
  end: Date;
  limit?: number;
};

export async function fetchFeedback(client: BigQuery, options: QueryOptions): Promise<FeedbackItem[]> {
  const [caseRows, universalRows] = await Promise.all([
    queryCaseClosure(client, options),
    queryUniversal(client, options),
  ]);

  return [...caseRows.map(normalizeCaseClosureRow), ...universalRows.map(normalizeUniversalRow)].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

async function queryCaseClosure(client: BigQuery, options: QueryOptions): Promise<Record<string, unknown>[]> {
  const limitClause = options.limit ? 'LIMIT @limit' : '';
  const [rows] = await client.query({
    query: `
      SELECT feedback_id, user_id, case_id, feedback_key, rating, explanation, suggested_output, created_at
      FROM \`${options.dataset}.public_feedbacks\`
      WHERE feedback_key = 'case-close-feedback'
        AND created_at BETWEEN @start AND @end
      ORDER BY created_at DESC
      ${limitClause}
    `,
    params: toParams(options),
  });
  return rows as Record<string, unknown>[];
}

async function queryUniversal(client: BigQuery, options: QueryOptions): Promise<Record<string, unknown>[]> {
  const limitClause = options.limit ? 'LIMIT @limit' : '';
  const [rows] = await client.query({
    query: `
      SELECT feedback_id, tenant_id, user_id, feedback_text, feedback_type, page_url, case_id, element_context, browser_info, created_at
      FROM \`${options.dataset}.public_universal_feedbacks\`
      WHERE created_at BETWEEN @start AND @end
      ORDER BY created_at DESC
      ${limitClause}
    `,
    params: toParams(options),
  });
  return rows as Record<string, unknown>[];
}

function toParams(options: QueryOptions): Record<string, unknown> {
  return {
    start: options.start.toISOString(),
    end: options.end.toISOString(),
    ...(options.limit ? { limit: options.limit } : {}),
  };
}
