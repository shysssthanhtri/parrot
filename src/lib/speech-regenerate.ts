import "server-only";

import { TRPCError } from "@trpc/server";

import { Prisma } from "@/generated/prisma/client";
import { canRegenerateSpeech } from "@/lib/speech-regenerate-eligibility";
import { deleteObjects, deleteSpeechChunkObjects } from "@/lib/storage";
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
  r2ObjectKey: string;
  deleteFinalWav: boolean;
  clearAlignment: boolean;
};

export async function resetSpeechForTtsRestart({
  speechId,
  r2ObjectKey,
  deleteFinalWav,
  clearAlignment,
}: ResetSpeechForTtsRestartInput) {
  await deleteSpeechChunkObjects(speechId);

  if (deleteFinalWav) {
    await deleteObjects([r2ObjectKey]);
  }

  if (clearAlignment) {
    await prisma.speech.update({
      where: { id: speechId },
      data: {
        alignment: Prisma.DbNull,
      },
    });
  }
}
