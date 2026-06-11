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

type SpeechRegenerateButtonProps = {
  scriptTitle: string;
  onRegenerate: () => void;
  isRegenerating?: boolean;
  variant?:
    | "default"
    | "outline"
    | "destructive"
    | "secondary"
    | "ghost"
    | "link";
  className?: string;
};

export function SpeechRegenerateButton({
  scriptTitle,
  onRegenerate,
  isRegenerating = false,
  variant = "outline",
  className,
}: SpeechRegenerateButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant={variant}
          disabled={isRegenerating}
          className={className}
        >
          {isRegenerating ? "Regenerating…" : "Regenerate"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Regenerate speech audio</AlertDialogTitle>
          <AlertDialogDescription>
            Regenerating &ldquo;{scriptTitle}&rdquo; deletes the current audio,
            chunk files, and alignment, then runs speech generation again from
            scratch. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onRegenerate();
              setOpen(false);
            }}
            disabled={isRegenerating}
          >
            {isRegenerating ? "Regenerating…" : "Regenerate"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
