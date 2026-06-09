import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getStorageDriver } from "@/lib/storage/config";
import { uploadLocalObject } from "@/lib/storage/local";
import { isSpeechObjectKey } from "@/lib/storage/speech-keys";

export async function PUT(req: Request) {
  if (getStorageDriver() !== "local") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.user.isCmsUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const key = new URL(req.url).searchParams.get("key");
  if (!key || !isSpeechObjectKey(key)) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  if (req.headers.get("content-type") !== "audio/wav") {
    return NextResponse.json(
      { error: "Content-Type must be audio/wav" },
      { status: 400 }
    );
  }

  const body = Buffer.from(await req.arrayBuffer());
  if (body.byteLength === 0) {
    return NextResponse.json({ error: "Empty body" }, { status: 400 });
  }

  if (body.subarray(0, 4).toString() !== "RIFF") {
    return NextResponse.json({ error: "Body must be WAV" }, { status: 400 });
  }

  await uploadLocalObject(key, body);

  return new NextResponse(null, { status: 204 });
}
