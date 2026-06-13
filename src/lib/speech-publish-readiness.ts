import "server-only";

import { TRPCError } from "@trpc/server";

import { speechScriptAlignmentSchema } from "@/lib/speech-script-alignment";
import { objectExists } from "@/lib/storage";

export type PublishReadinessIssue = {
  code: string;
  message: string;
};

export type SpeechForPublishReadiness = {
  processStatus: string;
  alignment: unknown;
  r2ObjectKey: string;
  thumbnailProcessStatus: string;
  thumbnailR2ObjectKey: string | null;
};

export type PublishReadinessChecker = (
  speech: SpeechForPublishReadiness
) => Promise<PublishReadinessIssue | null>;

const checkAudioFinished: PublishReadinessChecker = async (speech) => {
  if (speech.processStatus === "finished") {
    return null;
  }

  return {
    code: "audio_not_finished",
    message: "Only finished speeches can be published.",
  };
};

const checkAlignmentPresent: PublishReadinessChecker = async (speech) => {
  if (speech.alignment != null) {
    return null;
  }

  return {
    code: "alignment_missing",
    message: "Speech alignment is required before publishing.",
  };
};

const checkAlignmentValid: PublishReadinessChecker = async (speech) => {
  if (speech.alignment == null) {
    return null;
  }

  const alignmentResult = speechScriptAlignmentSchema.safeParse(
    speech.alignment
  );

  if (alignmentResult.success) {
    return null;
  }

  return {
    code: "alignment_invalid",
    message: "Speech alignment is invalid.",
  };
};

const checkFinalAudioExists: PublishReadinessChecker = async (speech) => {
  if (await objectExists(speech.r2ObjectKey)) {
    return null;
  }

  return {
    code: "final_audio_missing",
    message: "Final speech audio is missing.",
  };
};

const checkThumbnailReady: PublishReadinessChecker = async (speech) => {
  if (speech.thumbnailProcessStatus !== "finished") {
    if (speech.thumbnailProcessStatus === "failed") {
      return {
        code: "thumbnail_not_ready",
        message: "Speech thumbnail generation failed.",
      };
    }

    return {
      code: "thumbnail_not_ready",
      message: "Speech thumbnail is still generating.",
    };
  }

  if (
    !speech.thumbnailR2ObjectKey ||
    !(await objectExists(speech.thumbnailR2ObjectKey))
  ) {
    return {
      code: "thumbnail_missing",
      message: "Final speech thumbnail is missing.",
    };
  }

  return null;
};

const publishReadinessCheckers: PublishReadinessChecker[] = [
  checkAudioFinished,
  checkAlignmentPresent,
  checkAlignmentValid,
  checkFinalAudioExists,
  checkThumbnailReady,
];

export async function getPublishReadinessIssues(
  speech: SpeechForPublishReadiness
): Promise<PublishReadinessIssue[]> {
  const issues: PublishReadinessIssue[] = [];

  for (const checker of publishReadinessCheckers) {
    const issue = await checker(speech);

    if (issue) {
      issues.push(issue);
    }
  }

  return issues;
}

export async function assertSpeechReadyToPublish(
  speech: SpeechForPublishReadiness
) {
  for (const checker of publishReadinessCheckers) {
    const issue = await checker(speech);

    if (issue) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: issue.message,
      });
    }
  }
}
