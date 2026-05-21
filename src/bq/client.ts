import { BigQuery } from '@google-cloud/bigquery';
import type { AppConfig } from '../config.js';

export function createBigQueryClient(config: AppConfig): BigQuery {
  return new BigQuery({ projectId: config.googleCloudProject });
}
