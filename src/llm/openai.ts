import OpenAI from 'openai';
import type { JsonLlmProvider } from './types.js';

export type OpenAiProviderOptions = {
  apiKey?: string;
  model: string;
};

export class OpenAiJsonProvider implements JsonLlmProvider {
  private readonly client: OpenAI;

  constructor(private readonly options: OpenAiProviderOptions) {
    if (!options.apiKey) throw new Error('Missing required env: OPENAI_API_KEY');
    this.client = new OpenAI({ apiKey: options.apiKey });
  }

  async generateJson(input: { prompt: string; retry?: boolean }): Promise<unknown> {
    const response = await this.client.chat.completions.create({
      model: this.options.model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You produce valid JSON matching the requested schema.' },
        { role: 'user', content: input.retry ? `${input.prompt}\n\nPrevious response failed validation. Return valid JSON only.` : input.prompt },
      ],
    });
    const content = response.choices[0]?.message.content;
    if (!content) throw new Error('OpenAI returned empty content');
    return JSON.parse(content);
  }
}
