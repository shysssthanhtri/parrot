"use client";

import { useMutation } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useTRPC } from "@/trpc/client";

const COLOR_PRESETS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#6b7280", // gray
];

const DEFAULT_COLOR = "#6b7280";

type TopicFormValues = {
  name: string;
  description: string;
  color: string;
};

type TopicFormProps =
  | {
      mode: "create";
      defaultValues?: TopicFormValues;
    }
  | {
      mode: "edit";
      topicId: string;
      defaultValues: TopicFormValues;
    };

export function TopicForm(props: TopicFormProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const initialValues = props.defaultValues ?? {
    name: "",
    description: "",
    color: DEFAULT_COLOR,
  };

  const [name, setName] = useState(initialValues.name);
  const [description, setDescription] = useState(initialValues.description);
  const [color, setColor] = useState(initialValues.color);

  const createMutation = useMutation(
    trpc.topics.create.mutationOptions({
      onSuccess: (topic) => {
        router.push(ROUTES.CMS.TOPIC_DETAIL(topic.id));
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create topic");
      },
    })
  );

  const updateMutation = useMutation(
    trpc.topics.update.mutationOptions({
      onSuccess: () => {
        toast.success("Topic saved");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to save topic");
      },
    })
  );

  const suggestColorMutation = useMutation(
    trpc.topics.suggestColor.mutationOptions({
      onSuccess: (data) => {
        setColor(data.color);
        toast.success("Color suggested!");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to suggest color");
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
      name: name.trim(),
      description: description.trim() || undefined,
      color,
    };

    if (props.mode === "create") {
      createMutation.mutate(payload);
      return;
    }

    updateMutation.mutate({
      id: props.topicId,
      ...payload,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {props.mode === "create" ? "New topic" : "Edit topic"}
        </CardTitle>
        <CardDescription>
          {props.mode === "create"
            ? "Create a topic to organize your scripts."
            : "Update the topic details."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="topic-name">Name</Label>
            <Input
              id="topic-name"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Technology"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="topic-description">Description</Label>
            <Textarea
              id="topic-description"
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional description…"
              className="min-h-20"
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Color</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!name.trim() || suggestColorMutation.isPending}
                onClick={() =>
                  suggestColorMutation.mutate({
                    name: name.trim(),
                    description: description.trim() || undefined,
                  })
                }
              >
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                {suggestColorMutation.isPending
                  ? "Suggesting…"
                  : "Suggest with AI"}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: preset,
                    borderColor:
                      color === preset ? "currentColor" : "transparent",
                  }}
                  onClick={() => setColor(preset)}
                  aria-label={`Select color ${preset}`}
                />
              ))}
              {!COLOR_PRESETS.includes(color) && (
                <button
                  type="button"
                  className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: color,
                    borderColor: "currentColor",
                  }}
                  aria-label={`AI suggested color ${color}`}
                />
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save"}
            </Button>
            <Button variant="outline" asChild>
              <Link href={ROUTES.CMS.TOPICS}>Cancel</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
