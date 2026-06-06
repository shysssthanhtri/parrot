"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  getScriptLanguageLabel,
  type ScriptLanguageCode,
} from "@/lib/script-languages";
import { useTRPC } from "@/trpc/client";

const LENGTH_OPTIONS = [
  { value: "short", label: "Short (~30 seconds)" },
  { value: "medium", label: "Medium (~1 minute)" },
  { value: "long", label: "Long (~5 minutes)" },
] as const;

type ScriptGenerationLength = (typeof LENGTH_OPTIONS)[number]["value"];

type GeneratedScriptDraft = {
  title: string;
  content: string;
  generationId: string;
};

type ScriptGenerateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: ScriptLanguageCode;
  onGenerated: (draft: GeneratedScriptDraft) => void;
};

export function ScriptGenerateDialog({
  open,
  onOpenChange,
  language,
  onGenerated,
}: ScriptGenerateDialogProps) {
  const trpc = useTRPC();
  const [prompt, setPrompt] = useState("");
  const [length, setLength] = useState<ScriptGenerationLength>("medium");

  const generateMutation = useMutation(
    trpc.scriptGenerations.generate.mutationOptions({
      onSuccess: (result) => {
        onGenerated(result);
        onOpenChange(false);
        toast.success("Script draft generated");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to generate script");
      },
    })
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    generateMutation.mutate({
      prompt: prompt.trim(),
      length,
      language,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate with AI</DialogTitle>
          <DialogDescription>
            Describe what the script should be about. Content will be generated
            in {getScriptLanguageLabel(language)} using your selected language
            above.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="script-generate-prompt">Prompt</Label>
            <Textarea
              id="script-generate-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="e.g. A friendly introduction at a coffee shop"
              className="min-h-28"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="script-generate-length">Length</Label>
            <Select
              value={length}
              onValueChange={(value) =>
                setLength(value as ScriptGenerationLength)
              }
            >
              <SelectTrigger id="script-generate-length" className="w-full">
                <SelectValue placeholder="Select length" />
              </SelectTrigger>
              <SelectContent>
                {LENGTH_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={generateMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={generateMutation.isPending}>
              {generateMutation.isPending ? "Generating…" : "Generate"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
