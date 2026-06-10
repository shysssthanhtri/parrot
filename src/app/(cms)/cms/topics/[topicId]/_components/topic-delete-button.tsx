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

type TopicDeleteButtonProps = {
  topicId: string;
  topicName: string;
};

export function TopicDeleteButton({
  topicId,
  topicName,
}: TopicDeleteButtonProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const [open, setOpen] = useState(false);

  const deleteMutation = useMutation(
    trpc.topics.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Topic deleted");
        router.push(ROUTES.CMS.TOPICS);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete topic");
      },
    })
  );

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-fit">
          Delete topic
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete topic</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &ldquo;{topicName}&rdquo;? This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteMutation.mutate({ id: topicId })}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
