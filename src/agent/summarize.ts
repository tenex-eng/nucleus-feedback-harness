import type { FeedbackItem } from '../feedback/types.js';
import type { JsonLlmProvider } from '../llm/types.js';
import { buildDigestPrompt } from './prompt.js';
import { DigestSchema, type Digest } from './schema.js';

export async function summarizeFeedback(provider: JsonLlmProvider, input: { start: Date; end: Date; items: FeedbackItem[] }): Promise<Digest> {
  const prompt = buildDigestPrompt(input);
  return callAndParse(provider, prompt, false).catch(() => callAndParse(provider, prompt, true));
}

async function callAndParse(provider: JsonLlmProvider, prompt: string, retry: boolean): Promise<Digest> {
  return DigestSchema.parse(await provider.generateJson({ prompt, retry }));
}
