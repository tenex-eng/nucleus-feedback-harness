import type { FeedbackItem } from './types.js';

export type FeedbackChunk = {
  index: number;
  items: FeedbackItem[];
  itemIds: string[];
};

export type ChunkCoverage = {
  chunkSize: number;
  chunkCount: number;
  nonEmptyCount: number;
  emptyExcludedCount: number;
  chunks: Array<{ index: number; itemCount: number; itemIds: string[] }>;
};

export function partitionNonEmptyFeedback(items: FeedbackItem[], chunkSize: number): FeedbackChunk[] {
  if (!Number.isInteger(chunkSize) || chunkSize < 1) throw new Error('chunkSize must be a positive integer');
  const nonEmptyItems = [...items]
    .filter((item) => item.text.trim().length > 0)
    .sort(compareFeedbackItems);

  const chunks: FeedbackChunk[] = [];
  for (let start = 0; start < nonEmptyItems.length; start += chunkSize) {
    const chunkItems = nonEmptyItems.slice(start, start + chunkSize);
    chunks.push({ index: chunks.length, items: chunkItems, itemIds: chunkItems.map((item) => item.id) });
  }
  return chunks;
}

export function buildChunkCoverage(items: FeedbackItem[], chunks: FeedbackChunk[], chunkSize: number): ChunkCoverage {
  return {
    chunkSize,
    chunkCount: chunks.length,
    nonEmptyCount: items.filter((item) => item.text.trim().length > 0).length,
    emptyExcludedCount: items.filter((item) => item.text.trim().length === 0).length,
    chunks: chunks.map((chunk) => ({ index: chunk.index, itemCount: chunk.items.length, itemIds: chunk.itemIds })),
  };
}

function compareFeedbackItems(a: FeedbackItem, b: FeedbackItem): number {
  return a.createdAt.localeCompare(b.createdAt) || a.source.localeCompare(b.source) || a.id.localeCompare(b.id);
}
