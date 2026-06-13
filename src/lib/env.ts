import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const llmProviderSchema = z.enum(["vercel-ai-gateway", "gemini"]);

export const env = createEnv({
  client: {
    NEXT_PUBLIC_APP_URL: z.url().optional(),
  },
  server: {
    AUTH_SECRET: z.string().min(1),
    AUTH_GOOGLE_ID: z.string().min(1),
    AUTH_GOOGLE_SECRET: z.string().min(1),
    DATABASE_URL: z.string().min(1),
    STORAGE_DRIVER: z.enum(["local", "r2"]).optional(),
    LOCAL_STORAGE_DIR: z.string().min(1).optional(),
    R2_ACCOUNT_ID: z.string().min(1).optional(),
    R2_ACCESS_KEY_ID: z.string().min(1).optional(),
    R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    R2_BUCKET_NAME: z.string().min(1).optional(),
    R2_ENDPOINT: z.url().optional(),
    LLM_PROVIDER: llmProviderSchema.default("vercel-ai-gateway"),
    AI_GATEWAY_API_KEY: z.string().min(1).optional(),
    GEMINI_API_KEY: z.string().min(1).optional(),
    CHATTERBOX_API_URL: z.url(),
    CHATTERBOX_API_KEY: z.string().min(1),
    THUMBNAIL_API_URL: z.url(),
    THUMBNAIL_API_KEY: z.string().min(1),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  createFinalSchema: (shape, isServer) =>
    z.object(shape).superRefine((value, ctx) => {
      if (!isServer) {
        return;
      }

      const provider = value.LLM_PROVIDER ?? "vercel-ai-gateway";

      if (provider === "vercel-ai-gateway" && !value.AI_GATEWAY_API_KEY) {
        ctx.addIssue({
          code: "custom",
          message:
            "AI_GATEWAY_API_KEY is required when LLM_PROVIDER=vercel-ai-gateway",
          path: ["AI_GATEWAY_API_KEY"],
        });
      }

      if (provider === "gemini" && !value.GEMINI_API_KEY) {
        ctx.addIssue({
          code: "custom",
          message: "GEMINI_API_KEY is required when LLM_PROVIDER=gemini",
          path: ["GEMINI_API_KEY"],
        });
      }
    }),
});

export { getR2Endpoint, getStorageDriver } from "./storage/config";
