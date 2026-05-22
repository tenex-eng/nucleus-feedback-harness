import type { JsonLlmProvider } from './types.js';

export async function generateValidatedJson<T>(provider: JsonLlmProvider, input: {
  prompt: string;
  parse: (value: unknown) => T;
}): Promise<T> {
  try {
    return input.parse(await provider.generateJson({ prompt: input.prompt, retry: false }));
  } catch {
    return input.parse(await provider.generateJson({ prompt: input.prompt, retry: true }));
  }
}
