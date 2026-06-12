"use client";

import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type SpeechUnpublishAndRegenerateButtonProps = {
  scriptTitle: string;
  onUnpublishAndRegenerate: () => void;
  isUnpublishAndRegenerating?: boolean;
};

export function SpeechUnpublishAndRegenerateButton({
  scriptTitle,
  onUnpublishAndRegenerate,
  isUnpublishAndRegenerating = false,
}: SpeechUnpublishAndRegenerateButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="destructive"
          disabled={isUnpublishAndRegenerating}
        >
          {isUnpublishAndRegenerating
            ? "Unpublishing…"
            : "Unpublish and regenerate…"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unpublish and regenerate speech</AlertDialogTitle>
          <AlertDialogDescription>
            This removes &ldquo;{scriptTitle}&rdquo; from the learner catalog,
            deletes the current audio and alignment, and starts generation
            again. You will need to publish manually when the new audio is
            ready.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onUnpublishAndRegenerate();
              setOpen(false);
            }}
            disabled={isUnpublishAndRegenerating}
          >
            {isUnpublishAndRegenerating
              ? "Unpublishing…"
              : "Unpublish and regenerate"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
