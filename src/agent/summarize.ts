import { partitionNonEmptyFeedback, type ChunkCoverage, buildChunkCoverage } from '../feedback/chunks.js';
import type { FeedbackItem } from '../feedback/types.js';
import type { JsonLlmProvider } from '../llm/types.js';
import { buildDigestPrompt } from './prompt.js';
import { DigestSchema, type Digest } from './schema.js';

export const DEFAULT_SYNTHESIS_CHUNK_SIZE = 200;

export type SummarizeFeedbackResult = {
  digest: Digest;
  chunkCoverage: ChunkCoverage;
};

export async function summarizeFeedback(provider: JsonLlmProvider, input: { start: Date; end: Date; items: FeedbackItem[]; chunkSize?: number }): Promise<SummarizeFeedbackResult> {
  const chunkSize = input.chunkSize ?? DEFAULT_SYNTHESIS_CHUNK_SIZE;
  const chunks = partitionNonEmptyFeedback(input.items, chunkSize);
  const chunkCoverage = buildChunkCoverage(input.items, chunks, chunkSize);

  if (chunks.length === 0) {
    const digest = await digestChunk(provider, input.start, input.end, [], 0, 0);
    return { digest, chunkCoverage };
  }

  const chunkDigests = [];
  for (const chunk of chunks) {
    chunkDigests.push(await digestChunk(provider, input.start, input.end, chunk.items, chunk.index, chunks.length));
  }

  if (chunkDigests.length === 1) return { digest: chunkDigests[0], chunkCoverage };

  const digest = await synthesizeChunkDigests(provider, input.start, input.end, chunkDigests);
  return { digest, chunkCoverage };
}

async function digestChunk(provider: JsonLlmProvider, start: Date, end: Date, items: FeedbackItem[], chunkIndex: number, chunkCount: number): Promise<Digest> {
  const prompt = buildDigestPrompt({ start, end, items, chunkIndex, chunkCount });
  return callAndParse(provider, prompt, false).catch(() => callAndParse(provider, prompt, true));
}

async function synthesizeChunkDigests(provider: JsonLlmProvider, start: Date, end: Date, digests: Digest[]): Promise<Digest> {
  const prompt = `Synthesize these chunk-level feedback digests into one strict JSON digest. No markdown. No prose outside JSON.

Rules:
- Preserve period exactly.
- Totals must be the sum of chunk totals.
- Merge duplicate Research Findings across chunks.
- Evidence IDs and representative quotes must come from chunk digests.
- Keep 3-6 most actionable Research Findings.
- Preserve open questions for weak or ambiguous evidence.

JSON shape matches the chunk digests.
Period: ${start.toISOString()} to ${end.toISOString()}
Chunk digests JSON:
${JSON.stringify(digests, null, 2)}`;
  return callAndParse(provider, prompt, false).catch(() => callAndParse(provider, prompt, true));
}

async function callAndParse(provider: JsonLlmProvider, prompt: string, retry: boolean): Promise<Digest> {
  return DigestSchema.parse(await provider.generateJson({ prompt, retry }));
}
