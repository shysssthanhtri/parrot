import "server-only";

import { env } from "@/lib/env";

import { geminiProvider } from "./gemini";
import type { GenerateTextResult, LlmProvider } from "./types";
import { vercelGatewayProvider } from "./vercel-gateway";

const providers: Record<LlmProvider["providerId"], LlmProvider> = {
  "vercel-ai-gateway": vercelGatewayProvider,
  gemini: geminiProvider,
};

let activeProvider: LlmProvider | undefined;

const DEFAULT_LLM_PROVIDER: LlmProvider["providerId"] = "vercel-ai-gateway";

export function getLlmProvider(): LlmProvider {
  const providerId = env.LLM_PROVIDER ?? DEFAULT_LLM_PROVIDER;
  activeProvider ??= providers[providerId];

  if (!activeProvider) {
    throw new Error(`Unknown LLM_PROVIDER: ${providerId}`);
  }

  return activeProvider;
}

export async function generateText(
  prompt: string
): Promise<GenerateTextResult> {
  if (!prompt.trim()) {
    throw new Error("Prompt must not be empty");
  }

  return getLlmProvider().generateText(prompt);
}
