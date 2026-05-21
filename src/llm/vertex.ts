import { GoogleAuth } from 'google-auth-library';
import type { JsonLlmProvider } from './types.js';

export type VertexProviderOptions = {
  project: string;
  location: string;
  model: string;
};

export class VertexJsonProvider implements JsonLlmProvider {
  private readonly auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });

  constructor(private readonly options: VertexProviderOptions) {}

  async generateJson(input: { prompt: string; retry?: boolean }): Promise<unknown> {
    const client = await this.auth.getClient();
    const token = await client.getAccessToken();
    if (!token.token) throw new Error('Could not get Google ADC access token');

    const url = `https://${this.options.location}-aiplatform.googleapis.com/v1/projects/${this.options.project}/locations/${this.options.location}/publishers/google/models/${this.options.model}:generateContent`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: input.retry ? `${input.prompt}\n\nPrevious response failed validation. Return valid JSON only.` : input.prompt }] }],
        generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
      }),
    });

    const body = await response.json() as VertexResponse;
    if (!response.ok) throw new Error(`Vertex ${response.status}: ${body.error?.message ?? JSON.stringify(body)}`);
    const text = body.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Vertex returned empty content');
    return JSON.parse(text);
  }
}

type VertexResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { message?: string };
};
