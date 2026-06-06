import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";

import { env } from "@/lib/env";

export const GEMINI_SCRIPT_MODEL = "gemini-2.5-flash";

const client = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export function getGeminiScriptModel() {
  return client.getGenerativeModel({ model: GEMINI_SCRIPT_MODEL });
}
