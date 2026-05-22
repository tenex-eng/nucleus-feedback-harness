import { partitionNonEmptyFeedback, type ChunkCoverage, buildChunkCoverage, type FeedbackChunk } from '../feedback/chunks.js';
import type { FeedbackItem } from '../feedback/types.js';
import type { JsonLlmProvider } from '../llm/types.js';
import { mergeChunkDigests } from './merge.js';
import { buildDigestPrompt } from './prompt.js';
import { DigestSchema, type Digest } from './schema.js';

export const DEFAULT_SYNTHESIS_CHUNK_SIZE = 200;

export type FailedChunk = {
  index: number;
  itemCount: number;
  itemIds: string[];
  error: string;
};

export type DigestCompletion =
  | { status: 'complete' }
  | { status: 'incomplete'; unsynthesizedSignalCount: number; failedChunks: FailedChunk[] };

export type SynthesizeFeedbackDigestResult = {
  digest: Digest;
  chunkCoverage: ChunkCoverage;
  completion: DigestCompletion;
};

export async function synthesizeFeedbackDigest(provider: JsonLlmProvider, input: {
  period: { start: Date; end: Date };
  items: FeedbackItem[];
  chunkSize?: number;
}): Promise<SynthesizeFeedbackDigestResult> {
  const chunkSize = input.chunkSize ?? DEFAULT_SYNTHESIS_CHUNK_SIZE;
  const chunks = partitionNonEmptyFeedback(input.items, chunkSize);
  const chunkCoverage = buildChunkCoverage(input.items, chunks, chunkSize);

  if (chunks.length === 0) {
    const digest = await digestChunk(provider, input.period, { index: 0, items: [], itemIds: [] }, 0);
    return { digest, chunkCoverage, completion: { status: 'complete' } };
  }

  const { digests, failedChunks } = await digestChunks(provider, input.period, chunks);
  const digest = digests.length === 1
    ? digests[0]
    : mergeChunkDigests({ start: input.period.start, end: input.period.end, digests });
  return { digest, chunkCoverage, completion: completionFromFailedChunks(failedChunks) };
}

async function digestChunks(provider: JsonLlmProvider, period: { start: Date; end: Date }, chunks: FeedbackChunk[]): Promise<{ digests: Digest[]; failedChunks: FailedChunk[] }> {
  const digests: Digest[] = [];
  const failedChunks: FailedChunk[] = [];
  for (const chunk of chunks) {
    try {
      digests.push(await digestChunk(provider, period, chunk, chunks.length));
    } catch (error) {
      failedChunks.push({
        index: chunk.index,
        itemCount: chunk.items.length,
        itemIds: chunk.itemIds,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return { digests, failedChunks };
}

async function digestChunk(provider: JsonLlmProvider, period: { start: Date; end: Date }, chunk: FeedbackChunk, chunkCount: number): Promise<Digest> {
  const prompt = buildDigestPrompt({ start: period.start, end: period.end, items: chunk.items, chunkIndex: chunk.index, chunkCount });
  return callAndParse(provider, prompt, false).catch(() => callAndParse(provider, prompt, true));
}

function completionFromFailedChunks(failedChunks: FailedChunk[]): DigestCompletion {
  return failedChunks.length === 0
    ? { status: 'complete' }
    : { status: 'incomplete', unsynthesizedSignalCount: failedChunks.reduce((total, chunk) => total + chunk.itemCount, 0), failedChunks };
}

async function callAndParse(provider: JsonLlmProvider, prompt: string, retry: boolean): Promise<Digest> {
  return DigestSchema.parse(await provider.generateJson({ prompt, retry }));
}
