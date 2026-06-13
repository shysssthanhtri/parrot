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

type SpeechRegenerateThumbnailButtonProps = {
  scriptTitle: string;
  onRegenerateThumbnail: () => void;
  isRegeneratingThumbnail?: boolean;
};

export function SpeechRegenerateThumbnailButton({
  scriptTitle,
  onRegenerateThumbnail,
  isRegeneratingThumbnail = false,
}: SpeechRegenerateThumbnailButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
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
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onRegenerateThumbnail();
              setOpen(false);
            }}
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
