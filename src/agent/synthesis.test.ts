import { describe, expect, it } from 'vitest';
import { synthesizeFeedbackDigest } from './synthesis.js';
import type { Digest } from './schema.js';
import type { FeedbackItem } from '../feedback/types.js';
import type { JsonLlmProvider } from '../llm/types.js';

const period = { start: new Date('2026-01-01T00:00:00.000Z'), end: new Date('2026-01-08T00:00:00.000Z') };

const digest = (suffix: string): Digest => ({
  period: { start: period.start.toISOString(), end: period.end.toISOString() },
  totals: { caseClosure: 0, general: 1, targeted: 0 },
  executiveSummary: `summary ${suffix}`,
  researchFindings: [],
});

const item = (id: string, text = 'text'): FeedbackItem => ({ id, createdAt: `2026-01-0${id}T00:00:00.000Z`, source: 'general', text });

describe('synthesizeFeedbackDigest', () => {
  it('synthesizes every non-empty Feedback Signal exactly once', async () => {
    const prompts: string[] = [];
    const responses = [digest('1'), digest('2'), digest('3')];
    const provider: JsonLlmProvider = {
      async generateJson(input) {
        prompts.push(input.prompt);
        return responses.shift();
      },
    };

    const result = await synthesizeFeedbackDigest(provider, { period, items: [item('1'), item('2'), item('3'), item('4', '')], chunkSize: 1 });

    expect(result.chunkCoverage.chunks.flatMap((chunk) => chunk.itemIds)).toEqual(['1', '2', '3']);
    expect(prompts).toHaveLength(3);
    expect(prompts.join('\n')).not.toContain('"id": "4"');
    expect(result.digest.executiveSummary).toBe('No Research Findings were produced from the synthesized Feedback Signals.');
    expect(result.completion).toEqual({ status: 'complete' });
  });

  it('repairs Source Diversity from Feedback Signal sources', async () => {
    const provider: JsonLlmProvider = {
      async generateJson() {
        return {
          ...digest('source'),
          researchFindings: [{
            title: 'Finding',
            affectedWorkflow: 'Workflow',
            painOrNeed: 'Need.',
            severity: 'medium',
            confidence: 'medium',
            sourceDiversity: { caseClosure: 99, general: 99, targeted: 99 },
            evidenceIds: ['1', '2'],
            representativeQuotes: [],
            recommendedNextStep: 'Inspect workflow object.',
            openQuestions: [],
          }],
        };
      },
    };

    const result = await synthesizeFeedbackDigest(provider, { period, items: [item('1'), { ...item('2'), source: 'targeted' }], chunkSize: 10 });

    expect(result.digest.researchFindings[0].sourceDiversity).toEqual({ caseClosure: 0, general: 1, targeted: 1 });
  });

  it('retries transient chunk failures', async () => {
    const calls: boolean[] = [];
    const provider: JsonLlmProvider = {
      async generateJson(input) {
        calls.push(input.retry === true);
        if (!input.retry) throw new Error('rate limited');
        return digest('retry');
      },
    };

    const result = await synthesizeFeedbackDigest(provider, { period, items: [item('1')], chunkSize: 1 });

    expect(calls).toEqual([false, true]);
    expect(result.completion).toEqual({ status: 'complete' });
    expect(result.digest.executiveSummary).toBe('summary retry');
  });

  it('explains all-failed synthesis distinctly from no findings', async () => {
    const provider: JsonLlmProvider = {
      async generateJson() {
        throw new Error('quota exceeded');
      },
    };

    const result = await synthesizeFeedbackDigest(provider, { period, items: [item('1'), item('2')], chunkSize: 1 });

    expect(result.completion).toMatchObject({ status: 'incomplete', unsynthesizedSignalCount: 2 });
    expect(result.digest.executiveSummary).toBe('No Research Findings were produced because synthesis failed for every non-empty Feedback Signal.');
  });

  it('marks permanent chunk failures incomplete without dropping metadata', async () => {
    const provider: JsonLlmProvider = {
      async generateJson(input) {
        if (input.prompt.includes('"id": "2"')) throw new Error('provider down');
        return digest('ok');
      },
    };

    const result = await synthesizeFeedbackDigest(provider, { period, items: [item('1'), item('2')], chunkSize: 1 });

    expect(result.completion).toMatchObject({
      status: 'incomplete',
      unsynthesizedSignalCount: 1,
      failedChunks: [{ index: 1, itemCount: 1, itemIds: ['2'] }],
    });
    expect(result.digest.executiveSummary).toBe('summary ok');
  });
});
