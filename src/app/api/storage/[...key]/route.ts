import { NextResponse } from "next/server";

import { getStorageDriver } from "@/lib/storage/config";
import { readLocalObject } from "@/lib/storage/local";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string[] }> }
) {
  if (getStorageDriver() !== "local") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { key } = await params;
  const objectKey = key.join("/");
  const object = await readLocalObject(objectKey);

  if (!object) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(object.body), {
    headers: {
      "Content-Type": object.contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
