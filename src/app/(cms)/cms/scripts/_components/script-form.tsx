"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { ROUTES } from "@/app/configs/routes";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  DEFAULT_SCRIPT_LANGUAGE,
  SCRIPT_LANGUAGES,
  type ScriptLanguageCode,
} from "@/lib/script-languages";
import { useTRPC } from "@/trpc/client";

type ScriptFormValues = {
  title: string;
  content: string;
  language: ScriptLanguageCode;
};

type ScriptFormProps =
  | {
      mode: "create";
      defaultValues?: ScriptFormValues;
    }
  | {
      mode: "edit";
      scriptId: string;
      defaultValues: ScriptFormValues;
    };

export function ScriptForm(props: ScriptFormProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const initialValues = props.defaultValues ?? {
    title: "",
    content: "",
    language: DEFAULT_SCRIPT_LANGUAGE,
  };

  const [title, setTitle] = useState(initialValues.title);
  const [content, setContent] = useState(initialValues.content);
  const [language, setLanguage] = useState<ScriptLanguageCode>(
    initialValues.language
  );

  const createMutation = useMutation(
    trpc.scripts.create.mutationOptions({
      onSuccess: (script) => {
        router.push(ROUTES.CMS.SCRIPT_DETAIL(script.id));
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create script");
      },
    })
  );

  const updateMutation = useMutation(
    trpc.scripts.update.mutationOptions({
      onSuccess: () => {
        toast.success("Script saved");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to save script");
      },
    })
  );

  const isPending =
    props.mode === "create"
      ? createMutation.isPending
      : updateMutation.isPending;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      title: title.trim(),
      content: content.trim(),
      language,
    };

    if (props.mode === "create") {
      createMutation.mutate(payload);
      return;
    }

    updateMutation.mutate({
      id: props.scriptId,
      ...payload,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {props.mode === "create" ? "New script" : "Edit script"}
        </CardTitle>
        <CardDescription>
          {props.mode === "create"
            ? "Add a title, language, and the script text learners will shadow."
            : "Update the title, language, or script text, then save."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="script-title">Title</Label>
            <Input
              id="script-title"
              name="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Morning routine"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="script-language">Language</Label>
            <Select
              value={language}
              onValueChange={(value) =>
                setLanguage(value as ScriptLanguageCode)
              }
            >
              <SelectTrigger id="script-language" className="w-full">
                <SelectValue placeholder="Select a language" />
              </SelectTrigger>
              <SelectContent>
                {SCRIPT_LANGUAGES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="script-content">Content</Label>
            <Textarea
              id="script-content"
              name="content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Enter the full script text…"
              className="min-h-48"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save"}
            </Button>
            <Button variant="outline" asChild>
              <Link href={ROUTES.CMS.SCRIPTS}>Cancel</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function ScriptFormBackLink() {
  return (
    <Link
      href={ROUTES.CMS.SCRIPTS}
      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      ← Back to scripts
    </Link>
  );
}
