import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";

import { env } from "@/lib/env";

export const GEMINI_SCRIPT_MODEL = "gemini-2.5-flash";

let client: GoogleGenerativeAI | undefined;

function getClient() {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is required when LLM_PROVIDER=gemini");
  }

  client ??= new GoogleGenerativeAI(apiKey);
  return client;
}

export function getGeminiClient() {
  return getClient();
}
