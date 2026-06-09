"use client";

import { useState } from "react";

import { VoiceAudioPreview } from "@/app/(cms)/cms/voices/[voiceId]/_components/voice-audio-preview";
import { SpeechScriptSyncViewer } from "@/components/speech-script-sync-viewer";
import type { SpeechScriptAlignment } from "@/lib/speech-script-alignment";

type SpeechScriptPlaybackPanelProps = {
  audioUrl: string;
  alignment?: SpeechScriptAlignment | null;
  scriptContent?: string | null;
};

export function SpeechScriptPlaybackPanel({
  audioUrl,
  alignment,
  scriptContent,
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
      />
    </div>
  );
}
