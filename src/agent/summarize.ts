import { partitionNonEmptyFeedback, type ChunkCoverage, buildChunkCoverage } from '../feedback/chunks.js';
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

export type SummarizeFeedbackResult = {
  digest: Digest;
  chunkCoverage: ChunkCoverage;
  completion: DigestCompletion;
};

export async function summarizeFeedback(provider: JsonLlmProvider, input: { start: Date; end: Date; items: FeedbackItem[]; chunkSize?: number }): Promise<SummarizeFeedbackResult> {
  const chunkSize = input.chunkSize ?? DEFAULT_SYNTHESIS_CHUNK_SIZE;
  const chunks = partitionNonEmptyFeedback(input.items, chunkSize);
  const chunkCoverage = buildChunkCoverage(input.items, chunks, chunkSize);

  if (chunks.length === 0) {
    const digest = await digestChunk(provider, input.start, input.end, [], 0, 0);
    return { digest, chunkCoverage, completion: { status: 'complete' } };
  }

  const chunkDigests = [];
  const failedChunks: FailedChunk[] = [];
  for (const chunk of chunks) {
    try {
      chunkDigests.push(await digestChunk(provider, input.start, input.end, chunk.items, chunk.index, chunks.length));
    } catch (error) {
      failedChunks.push({
        index: chunk.index,
        itemCount: chunk.items.length,
        itemIds: chunk.itemIds,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const digest = chunkDigests.length === 1
    ? chunkDigests[0]
    : mergeChunkDigests({ start: input.start, end: input.end, digests: chunkDigests });
  const completion: DigestCompletion = failedChunks.length === 0
    ? { status: 'complete' }
    : { status: 'incomplete', unsynthesizedSignalCount: failedChunks.reduce((total, chunk) => total + chunk.itemCount, 0), failedChunks };
  return { digest, chunkCoverage, completion };
}

async function digestChunk(provider: JsonLlmProvider, start: Date, end: Date, items: FeedbackItem[], chunkIndex: number, chunkCount: number): Promise<Digest> {
  const prompt = buildDigestPrompt({ start, end, items, chunkIndex, chunkCount });
  return callAndParse(provider, prompt, false).catch(() => callAndParse(provider, prompt, true));
}

async function callAndParse(provider: JsonLlmProvider, prompt: string, retry: boolean): Promise<Digest> {
  return DigestSchema.parse(await provider.generateJson({ prompt, retry }));
}
