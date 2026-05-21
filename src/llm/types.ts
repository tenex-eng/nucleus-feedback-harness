export type LlmProviderName = 'openai' | 'vertex';

export type GenerateJsonInput = {
  prompt: string;
  retry?: boolean;
};

export interface JsonLlmProvider {
  generateJson(input: GenerateJsonInput): Promise<unknown>;
}
