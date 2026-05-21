import { describe, expect, it } from 'vitest';
import { buildChunkCoverage, partitionNonEmptyFeedback } from './chunks.js';
import type { FeedbackItem } from './types.js';

const item = (id: string, createdAt: string, text = 'text', source: FeedbackItem['source'] = 'general'): FeedbackItem => ({ id, createdAt, text, source });

describe('partitionNonEmptyFeedback', () => {
  it('is deterministic by createdAt, source, id', () => {
    const items = [
      item('b', '2026-01-02', 'b', 'targeted'),
      item('a', '2026-01-01', 'a', 'general'),
      item('c', '2026-01-02', 'c', 'case_closure'),
    ];

    expect(partitionNonEmptyFeedback(items, 2).map((chunk) => chunk.itemIds)).toEqual([['a', 'c'], ['b']]);
    expect(partitionNonEmptyFeedback([...items].reverse(), 2).map((chunk) => chunk.itemIds)).toEqual([['a', 'c'], ['b']]);
  });

  it('excludes empty signals and includes each non-empty signal exactly once', () => {
    const items = [item('1', '2026-01-01'), item('2', '2026-01-02', '  '), item('3', '2026-01-03'), item('4', '2026-01-04', '')];
    const ids = partitionNonEmptyFeedback(items, 1).flatMap((chunk) => chunk.itemIds);

    expect(ids).toEqual(['1', '3']);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('exposes chunk coverage', () => {
    const items = [item('1', '2026-01-01'), item('2', '2026-01-02', ''), item('3', '2026-01-03')];
    const chunks = partitionNonEmptyFeedback(items, 2);

    expect(buildChunkCoverage(items, chunks, 2)).toEqual({
      chunkSize: 2,
      chunkCount: 1,
      nonEmptyCount: 2,
      emptyExcludedCount: 1,
      chunks: [{ index: 0, itemCount: 2, itemIds: ['1', '3'] }],
    });
  });
});
