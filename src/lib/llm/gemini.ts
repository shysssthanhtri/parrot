import "server-only";

import { GEMINI_SCRIPT_MODEL, getGeminiClient } from "@/lib/gemini";

import type { LlmProvider } from "./types";

export const geminiProvider: LlmProvider = {
  providerId: "gemini",

  async generateText(prompt) {
    const model = getGeminiClient().getGenerativeModel({
      model: GEMINI_SCRIPT_MODEL,
    });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    if (!text.trim()) {
      throw new Error("Model returned an empty response");
    }

    return { text, modelId: GEMINI_SCRIPT_MODEL };
  },
};
