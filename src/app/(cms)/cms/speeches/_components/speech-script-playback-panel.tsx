"use client";

import { useState } from "react";

import { SpeechRegenerateButton } from "@/app/(cms)/cms/speeches/[speechId]/_components/speech-regenerate-button";
import { VoiceAudioPreview } from "@/app/(cms)/cms/voices/[voiceId]/_components/voice-audio-preview";
import { SpeechScriptSyncViewer } from "@/components/speech-script-sync-viewer";
import type { SpeechScriptAlignment } from "@/lib/speech-script-alignment";

type SpeechScriptPlaybackPanelProps = {
  audioUrl: string;
  alignment?: SpeechScriptAlignment | null;
  scriptContent?: string | null;
  scriptTitle?: string;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  canRegenerate?: boolean;
};

export function SpeechScriptPlaybackPanel({
  audioUrl,
  alignment,
  scriptContent,
  scriptTitle,
  onRegenerate,
  isRegenerating,
  canRegenerate,
}: SpeechScriptPlaybackPanelProps) {
  const [currentTimeMs, setCurrentTimeMs] = useState(0);

  return (
    <div className="flex flex-col gap-4">
      {alignment ? (
        <SpeechScriptSyncViewer
          alignment={alignment}
          currentTimeMs={currentTimeMs}
        />
      ) : scriptContent ? (
        <div className="max-h-64 overflow-y-auto rounded-md border bg-background p-4">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {scriptContent}
          </p>
        </div>
      ) : null}
      <VoiceAudioPreview
        audioUrl={audioUrl}
        onTimeUpdate={alignment ? setCurrentTimeMs : undefined}
        errorActions={
          onRegenerate && canRegenerate && scriptTitle ? (
            <SpeechRegenerateButton
              scriptTitle={scriptTitle}
              onRegenerate={onRegenerate}
              isRegenerating={isRegenerating}
              className="h-8"
            />
          ) : null
        }
      />
    </div>
  );
}
