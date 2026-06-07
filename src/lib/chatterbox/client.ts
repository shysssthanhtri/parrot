import "server-only";

import createClient from "openapi-fetch";

import { env } from "@/lib/env";

import type { paths } from "./schema";

let client: ReturnType<typeof createClient<paths>> | undefined;

export function createChatterboxClient() {
  if (!client) {
    client = createClient<paths>({
      baseUrl: env.CHATTERBOX_API_URL,
      headers: {
        "x-api-key": env.CHATTERBOX_API_KEY,
      },
    });
  }

  return client;
}
