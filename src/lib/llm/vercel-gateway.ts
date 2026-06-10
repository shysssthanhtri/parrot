import "server-only";

import { createGateway, generateText as aiGenerateText } from "ai";

import { env } from "@/lib/env";

import type { LlmProvider } from "./types";

// export const VERCEL_GATEWAY_MODEL = "google/gemini-2.5-flash";
export const VERCEL_GATEWAY_MODEL = "google/gemini-2.5-flash-lite";
// export const VERCEL_GATEWAY_MODEL = "google/gemini-3.1-flash-lite";

const gateway = createGateway({
  apiKey: env.AI_GATEWAY_API_KEY ?? "",
});

export const vercelGatewayProvider: LlmProvider = {
  providerId: "vercel-ai-gateway",

  async generateText(prompt) {
    const { text } = await aiGenerateText({
      model: gateway(VERCEL_GATEWAY_MODEL),
      prompt,
    });

    if (!text.trim()) {
      throw new Error("Model returned an empty response");
    }

    return { text, modelId: VERCEL_GATEWAY_MODEL };
  },
};
