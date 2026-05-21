import 'dotenv/config';

import type { LlmProviderName } from './llm/types.js';

export type AppConfig = {
  googleCloudProject: string;
  bqDataset: string;
  llmProvider: LlmProviderName;
  openaiApiKey?: string;
  openaiModel: string;
  vertexProject: string;
  vertexLocation: string;
  vertexModel: string;
  outputDir: string;
};

export function loadConfig(): AppConfig {
  return {
    googleCloudProject: required('GOOGLE_CLOUD_PROJECT'),
    bqDataset: process.env.BQ_DATASET ?? 'core',
    llmProvider: parseProvider(process.env.LLM_PROVIDER ?? 'openai'),
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiModel: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
    vertexProject: process.env.VERTEX_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT ?? 'nucleus-analytics',
    vertexLocation: process.env.VERTEX_LOCATION ?? 'us-central1',
    vertexModel: process.env.VERTEX_MODEL ?? 'gemini-2.5-flash',
    outputDir: process.env.OUTPUT_DIR ?? './digests',
  };
}

function parseProvider(value: string): LlmProviderName {
  if (value === 'openai' || value === 'vertex') return value;
  throw new Error(`Invalid LLM_PROVIDER: ${value}. Use openai or vertex.`);
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}
