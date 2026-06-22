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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SPEECH_THUMBNAIL_EXTRA_PROMPT_MAX_LENGTH } from "@/lib/speech-thumbnail-prompt";

type SpeechRegenerateThumbnailButtonProps = {
  scriptTitle: string;
  onRegenerateThumbnail: (extraPrompt?: string) => void;
  isRegeneratingThumbnail?: boolean;
};

export function SpeechRegenerateThumbnailButton({
  scriptTitle,
  onRegenerateThumbnail,
  isRegeneratingThumbnail = false,
}: SpeechRegenerateThumbnailButtonProps) {
  const [open, setOpen] = useState(false);
  const [extraPrompt, setExtraPrompt] = useState("");

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setExtraPrompt("");
    }
  };

  const handleConfirm = () => {
    const trimmedExtraPrompt = extraPrompt.trim();
    onRegenerateThumbnail(trimmedExtraPrompt || undefined);
    setExtraPrompt("");
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={isRegeneratingThumbnail}
        >
          {isRegeneratingThumbnail
            ? "Regenerating thumbnail…"
            : "Regenerate thumbnail"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Regenerate speech thumbnail</AlertDialogTitle>
          <AlertDialogDescription>
            Regenerating the thumbnail for &ldquo;{scriptTitle}&rdquo; deletes
            the current cover image and generates a new one from the script
            metadata.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="speech-thumbnail-extra-prompt">
            Extra prompt (optional)
          </Label>
          <Textarea
            id="speech-thumbnail-extra-prompt"
            value={extraPrompt}
            onChange={(event) => setExtraPrompt(event.target.value)}
            placeholder="e.g. Warm sunset tones, outdoor café setting"
            className="min-h-28"
            maxLength={SPEECH_THUMBNAIL_EXTRA_PROMPT_MAX_LENGTH}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isRegeneratingThumbnail}
          >
            {isRegeneratingThumbnail
              ? "Regenerating thumbnail…"
              : "Regenerate thumbnail"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
