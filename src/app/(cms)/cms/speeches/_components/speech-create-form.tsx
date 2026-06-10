"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { InfoIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatContentLength } from "@/lib/content-length";
import {
  DEFAULT_SCRIPT_LANGUAGE,
  SCRIPT_LANGUAGES,
  type ScriptLanguageCode,
} from "@/lib/script-languages";
import {
  DEFAULT_SPEECH_TTS_PARAMS,
  NORM_LOUDNESS_CONTROL,
  SPEECH_SLIDERS,
  type SpeechSliderId,
  type SpeechTtsParams,
} from "@/lib/speech-sliders";
import { useTRPC } from "@/trpc/client";

type SpeechCreateInput = SpeechTtsParams & {
  voiceId: string;
  scriptId: string;
  language: ScriptLanguageCode;
};

function ControlLabelWithTooltip({
  htmlFor,
  label,
  description,
}: {
  htmlFor?: string;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex text-muted-foreground transition-colors hover:text-foreground"
            aria-label={`About ${label}`}
          >
            <InfoIcon className="size-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent sideOffset={4}>{description}</TooltipContent>
      </Tooltip>
    </div>
  );
}

export function SpeechCreateForm() {
  const router = useRouter();
  const trpc = useTRPC();

  const [language, setLanguage] = useState<ScriptLanguageCode>(
    DEFAULT_SCRIPT_LANGUAGE
  );
  const [voiceId, setVoiceId] = useState("");
  const [scriptId, setScriptId] = useState("");
  const [ttsParams, setTtsParams] = useState<SpeechTtsParams>(
    DEFAULT_SPEECH_TTS_PARAMS
  );

  const voicesQuery = useQuery(trpc.voices.list.queryOptions());
  const scriptsQuery = useQuery(trpc.scripts.list.queryOptions());

  const filteredVoices = useMemo(() => {
    return (voicesQuery.data ?? []).filter(
      (voice) => voice.language === language && voice.r2ObjectKey
    );
  }, [voicesQuery.data, language]);

  const filteredScripts = useMemo(() => {
    return (scriptsQuery.data ?? []).filter(
      (script) => script.language === language
    );
  }, [scriptsQuery.data, language]);

  const currentInput = useMemo<SpeechCreateInput | null>(() => {
    if (!voiceId || !scriptId) return null;

    return {
      voiceId,
      scriptId,
      language,
      ...ttsParams,
    };
  }, [voiceId, scriptId, language, ttsParams]);

  const canCreate = currentInput !== null;

  const createMutation = useMutation(
    trpc.speeches.create.mutationOptions({
      onError: (error) => {
        toast.error(error.message || "Failed to create speech");
      },
    })
  );

  function handleLanguageChange(value: ScriptLanguageCode) {
    setLanguage(value);
    setVoiceId("");
    setScriptId("");
  }

  function updateTtsParam(id: SpeechSliderId, value: number) {
    setTtsParams((current) => ({ ...current, [id]: value }));
  }

  function handleCreate() {
    if (!currentInput) return;

    createMutation.mutate(currentInput, {
      onSuccess: (speech) => {
        router.push(ROUTES.CMS.SPEECH_DETAIL(speech.id));
        toast.success("Speech created — generation started");
      },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>New speech</CardTitle>
          <CardDescription>
            Choose a language, voice, and script. Audio is generated in the
            background after you create the speech.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="speech-language">Language</Label>
            <Select
              value={language}
              onValueChange={(value) =>
                handleLanguageChange(value as ScriptLanguageCode)
              }
            >
              <SelectTrigger id="speech-language" className="w-full">
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
            <Label htmlFor="speech-voice">Voice</Label>
            <Select
              value={voiceId}
              onValueChange={setVoiceId}
              disabled={!language || voicesQuery.isLoading}
            >
              <SelectTrigger id="speech-voice" className="w-full">
                <SelectValue
                  placeholder={
                    voicesQuery.isLoading
                      ? "Loading voices…"
                      : filteredVoices.length === 0
                        ? "No voices with audio for this language"
                        : "Select a voice"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {filteredVoices.map((voice) => (
                  <SelectItem key={voice.id} value={voice.id}>
                    {voice.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="speech-script">Script</Label>
            <Select
              value={scriptId}
              onValueChange={setScriptId}
              disabled={!language || scriptsQuery.isLoading}
            >
              <SelectTrigger id="speech-script" className="w-full">
                <SelectValue
                  placeholder={
                    scriptsQuery.isLoading
                      ? "Loading scripts…"
                      : filteredScripts.length === 0
                        ? "No scripts for this language"
                        : "Select a script"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {filteredScripts.map((script) => (
                  <SelectItem key={script.id} value={script.id}>
                    {script.title} ({formatContentLength(script.contentLength)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>TTS settings</CardTitle>
          <CardDescription>
            Adjust delivery controls before creating the speech.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {SPEECH_SLIDERS.map((slider) => (
            <div key={slider.id} className="grid gap-2">
              <div className="flex items-center justify-between gap-2">
                <ControlLabelWithTooltip
                  htmlFor={`speech-${slider.id}`}
                  label={slider.label}
                  description={slider.description}
                />
                <span className="font-mono text-sm text-muted-foreground tabular-nums">
                  {ttsParams[slider.id]}
                </span>
              </div>
              <Slider
                id={`speech-${slider.id}`}
                min={slider.min}
                max={slider.max}
                step={slider.step}
                value={[ttsParams[slider.id]]}
                onValueChange={([value]) => updateTtsParam(slider.id, value)}
              />
            </div>
          ))}

          <div className="flex items-center justify-between gap-4">
            <ControlLabelWithTooltip
              label={NORM_LOUDNESS_CONTROL.label}
              description={NORM_LOUDNESS_CONTROL.description}
            />
            <Switch
              checked={ttsParams.normLoudness}
              onCheckedChange={(checked) => {
                setTtsParams((current) => ({
                  ...current,
                  normLoudness: checked,
                }));
              }}
              aria-label={NORM_LOUDNESS_CONTROL.label}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={handleCreate}
          disabled={!canCreate || createMutation.isPending}
        >
          {createMutation.isPending ? "Creating…" : "Create"}
        </Button>
        <Button variant="ghost" asChild>
          <Link href={ROUTES.CMS.SPEECHES}>Cancel</Link>
        </Button>
      </div>
    </div>
  );
}

export function SpeechCreateFormBackLink() {
  return (
    <Link
      href={ROUTES.CMS.SPEECHES}
      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      ← Back to speeches
    </Link>
  );
}
