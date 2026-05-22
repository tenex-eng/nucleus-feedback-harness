import { describe, expect, it } from 'vitest';
import { generateValidatedJson } from './json.js';
import type { JsonLlmProvider } from './types.js';

describe('generateValidatedJson', () => {
  it('returns parsed JSON on first valid response', async () => {
    const provider: JsonLlmProvider = { generateJson: async () => ({ ok: true }) };

    await expect(generateValidatedJson(provider, { prompt: 'p', parse: (value) => value as { ok: boolean } })).resolves.toEqual({ ok: true });
  });

  it('retries after provider or validation failure', async () => {
    const retries: boolean[] = [];
    const provider: JsonLlmProvider = {
      async generateJson(input) {
        retries.push(input.retry === true);
        if (!input.retry) return { ok: false };
        return { ok: true };
      },
    };

    const result = await generateValidatedJson(provider, {
      prompt: 'p',
      parse: (value) => {
        if ((value as { ok?: boolean }).ok !== true) throw new Error('invalid');
        return value as { ok: true };
      },
    });

    expect(result).toEqual({ ok: true });
    expect(retries).toEqual([false, true]);
  });
});
