import "server-only";

import { TRPCError } from "@trpc/server";

import { Prisma } from "@/generated/prisma/client";
import { canRegenerateSpeech } from "@/lib/speech-regenerate-eligibility";
import { deleteObjects } from "@/lib/storage";
import { prisma } from "@/prisma";

export {
  canRegenerateSpeech,
  REGENERATE_STUCK_THRESHOLD_MS,
} from "@/lib/speech-regenerate-eligibility";

export function assertSpeechCanRegenerate(
  speech: Parameters<typeof canRegenerateSpeech>[0]
) {
  if (canRegenerateSpeech(speech)) {
    return;
  }

  throw new TRPCError({
    code: "BAD_REQUEST",
    message:
      "Speech is still processing. Regenerate is available 30 minutes after processing started.",
  });
}

type ResetSpeechForTtsRestartInput = {
  speechId: string;
  chunks: { tempR2Key: string }[];
  r2ObjectKey: string;
  deleteFinalWav: boolean;
  clearAlignment: boolean;
};

export async function resetSpeechForTtsRestart({
  speechId,
  chunks,
  r2ObjectKey,
  deleteFinalWav,
  clearAlignment,
}: ResetSpeechForTtsRestartInput) {
  const storageKeys = [
    ...chunks.map((chunk) => chunk.tempR2Key),
    ...(deleteFinalWav ? [r2ObjectKey] : []),
  ];

  if (storageKeys.length > 0) {
    await deleteObjects(storageKeys);
  }

  await prisma.$transaction(async (tx) => {
    await tx.speechChunk.deleteMany({ where: { speechId } });
    await tx.speech.update({
      where: { id: speechId },
      data: {
        processStatus: "pending",
        errorMessage: null,
        totalChunks: 0,
        settledChunks: 0,
        processingStartedAt: null,
        ...(clearAlignment ? { alignment: Prisma.DbNull } : {}),
      },
    });
  });
}
