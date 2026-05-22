import type { FeedbackItem } from '../feedback/types.js';
import type { JsonLlmProvider } from '../llm/types.js';
import { synthesizeFeedbackDigest, DEFAULT_SYNTHESIS_CHUNK_SIZE } from './synthesis.js';
export { DEFAULT_SYNTHESIS_CHUNK_SIZE } from './synthesis.js';
export type {
  DigestCompletion,
  FailedChunk,
  SynthesizeFeedbackDigestResult as SummarizeFeedbackResult,
} from './synthesis.js';

/** @deprecated Prefer synthesizeFeedbackDigest. */
export function summarizeFeedback(provider: JsonLlmProvider, input: { start: Date; end: Date; items: FeedbackItem[]; chunkSize?: number }) {
  return synthesizeFeedbackDigest(provider, {
    period: { start: input.start, end: input.end },
    items: input.items,
    chunkSize: input.chunkSize ?? DEFAULT_SYNTHESIS_CHUNK_SIZE,
  });
}
