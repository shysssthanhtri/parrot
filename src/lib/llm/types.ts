export type LlmProviderId = "vercel-ai-gateway" | "gemini";

export type GenerateTextResult = {
  text: string;
  modelId: string;
};

export interface LlmProvider {
  readonly providerId: LlmProviderId;
  generateText(prompt: string): Promise<GenerateTextResult>;
}
