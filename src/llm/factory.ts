import type { AppConfig } from '../config.js';
import { OpenAiJsonProvider } from './openai.js';
import type { JsonLlmProvider, LlmProviderName } from './types.js';
import { VertexJsonProvider } from './vertex.js';

export function createJsonLlmProvider(config: AppConfig, overrides: { provider?: LlmProviderName; model?: string }): JsonLlmProvider {
  const provider = overrides.provider ?? config.llmProvider;
  if (provider === 'openai') {
    return new OpenAiJsonProvider({ apiKey: config.openaiApiKey, model: overrides.model ?? config.openaiModel });
  }
  return new VertexJsonProvider({
    project: config.vertexProject,
    location: config.vertexLocation,
    model: overrides.model ?? config.vertexModel,
  });
}

export function parseProvider(value: string | undefined): LlmProviderName | undefined {
  if (value == null) return undefined;
  if (value === 'openai' || value === 'vertex') return value;
  throw new Error(`Invalid provider: ${value}. Use openai or vertex.`);
}
