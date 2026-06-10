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

export function getLlmProvider(): LlmProvider {
  activeProvider ??= providers[env.LLM_PROVIDER];
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
