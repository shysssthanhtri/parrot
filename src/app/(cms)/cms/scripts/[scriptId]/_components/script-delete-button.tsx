"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { ROUTES } from "@/app/configs/routes";
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
import { useTRPC } from "@/trpc/client";

type ScriptDeleteButtonProps = {
  scriptId: string;
  scriptTitle: string;
  speechCount: number;
};

export function ScriptDeleteButton({
  scriptId,
  scriptTitle,
  speechCount,
}: ScriptDeleteButtonProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const [open, setOpen] = useState(false);

  const deleteMutation = useMutation(
    trpc.scripts.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Script deleted");
        router.push(ROUTES.CMS.SCRIPTS);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete script");
      },
    })
  );

  const speechLabel =
    speechCount === 1 ? "1 linked speech" : `${speechCount} linked speeches`;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-fit">
          Delete script
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete script</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &ldquo;{scriptTitle}&rdquo;? This
            action cannot be undone.
            {speechCount > 0 && (
              <>
                {" "}
                This will also permanently delete {speechLabel} and all
                generated audio files.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteMutation.mutate({ id: scriptId })}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
