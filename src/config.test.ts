import { afterEach, describe, expect, it, vi } from 'vitest';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.resetModules();
});

describe('loadConfig', () => {
  it('defaults pnpm digest to Vertex', async () => {
    process.env.GOOGLE_CLOUD_PROJECT = 'nucleus-analytics';
    delete process.env.LLM_PROVIDER;
    const { loadConfig } = await import('./config.js');

    expect(loadConfig().llmProvider).toBe('vertex');
  });
});
