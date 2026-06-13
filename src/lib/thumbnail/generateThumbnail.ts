import "server-only";

import { env } from "@/lib/env";

export type ThumbnailRequest = {
  prompt: string;
  seed?: number;
};

function formatThumbnailError(status: number, detail: unknown): string {
  if (detail !== undefined && detail !== null) {
    return `Thumbnail request failed (${status}): ${JSON.stringify(detail)}`;
  }

  return `Thumbnail request failed (${status})`;
}

export async function generateThumbnail(
  body: ThumbnailRequest
): Promise<Buffer> {
  const response = await fetch(`${env.THUMBNAIL_API_URL}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.THUMBNAIL_API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let detail: unknown;

    try {
      detail = await response.json();
    } catch {
      detail = await response.text();
    }

    throw new Error(formatThumbnailError(response.status, detail));
  }

  const data = await response.arrayBuffer();

  if (data.byteLength === 0) {
    throw new Error("Thumbnail API returned empty image");
  }

  return Buffer.from(data);
}
