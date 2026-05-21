import { describe, expect, it } from 'vitest';
import { summarizeFeedback } from './summarize.js';
import type { Digest } from './schema.js';
import type { FeedbackItem } from '../feedback/types.js';
import type { JsonLlmProvider } from '../llm/types.js';

const digest = (suffix: string): Digest => ({
  period: { start: '2026-01-01T00:00:00.000Z', end: '2026-01-08T00:00:00.000Z' },
  totals: { caseClosure: 0, general: 1, targeted: 0 },
  executiveSummary: `summary ${suffix}`,
  researchFindings: [],
});

const item = (id: string, text = 'text'): FeedbackItem => ({ id, createdAt: `2026-01-0${id}T00:00:00.000Z`, source: 'general', text });

describe('summarizeFeedback', () => {
  it('calls synthesis once per non-empty chunk with no sampling cap', async () => {
    const prompts: string[] = [];
    const responses = [digest('1'), digest('2'), digest('3'), digest('merged')];
    const provider: JsonLlmProvider = {
      async generateJson(input) {
        prompts.push(input.prompt);
        return responses.shift();
      },
    };

    const result = await summarizeFeedback(provider, {
      start: new Date('2026-01-01T00:00:00.000Z'),
      end: new Date('2026-01-08T00:00:00.000Z'),
      items: [item('1'), item('2'), item('3'), item('4', '')],
      chunkSize: 1,
    });

    expect(result.chunkCoverage.nonEmptyCount).toBe(3);
    expect(result.chunkCoverage.emptyExcludedCount).toBe(1);
    expect(result.chunkCoverage.chunks.flatMap((chunk) => chunk.itemIds)).toEqual(['1', '2', '3']);
    expect(prompts).toHaveLength(4);
    expect(prompts[0]).toContain('"id": "1"');
    expect(prompts[1]).toContain('"id": "2"');
    expect(prompts[2]).toContain('"id": "3"');
    expect(prompts.join('\n')).not.toContain('"id": "4"');
    expect(result.digest.executiveSummary).toBe('summary merged');
  });
});
