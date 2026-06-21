import { Badge } from "@/components/ui/badge";
import {
  getSpeechTtsGenerationStatusLabel,
  speechTtsGenerationStatusSchema,
  type SpeechTtsGenerationStatusValue,
} from "@/lib/speech-process-status";

const STATUS_VARIANTS: Record<
  SpeechTtsGenerationStatusValue,
  "default" | "secondary" | "destructive" | "outline"
> = {
  processing: "default",
  finished: "outline",
  failed: "destructive",
};

export function SpeechProcessStatusBadge({
  status,
}: {
  status: string | null | undefined;
}) {
  const parsed = speechTtsGenerationStatusSchema.safeParse(status);
  const normalized: SpeechTtsGenerationStatusValue = parsed.success
    ? parsed.data
    : "processing";

  return (
    <Badge variant={STATUS_VARIANTS[normalized]}>
      {getSpeechTtsGenerationStatusLabel(normalized)}
    </Badge>
  );
}
