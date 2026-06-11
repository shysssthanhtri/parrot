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

type SpeechDeleteButtonProps = {
  speechId: string;
  scriptTitle: string;
};

export function SpeechDeleteButton({
  speechId,
  scriptTitle,
}: SpeechDeleteButtonProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const [open, setOpen] = useState(false);

  const deleteMutation = useMutation(
    trpc.speeches.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Speech deleted");
        router.push(ROUTES.CMS.SPEECHES);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete speech");
      },
    })
  );

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-fit">
          Delete speech
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete speech</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the speech for &ldquo;{scriptTitle}
            &rdquo;? This action cannot be undone and will remove all generated
            audio files.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteMutation.mutate({ id: speechId })}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
