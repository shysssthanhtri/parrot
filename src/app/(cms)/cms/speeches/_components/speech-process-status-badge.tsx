import { Badge } from "@/components/ui/badge";
import {
  SPEECH_PROCESS_STATUS_LABELS,
  type SpeechProcessStatus,
  speechProcessStatusSchema,
} from "@/lib/speech-process-status";

const STATUS_VARIANTS: Record<
  SpeechProcessStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  processing: "default",
  finished: "outline",
  failed: "destructive",
};

export function SpeechProcessStatusBadge({ status }: { status: string }) {
  const parsed = speechProcessStatusSchema.safeParse(status);
  const normalized: SpeechProcessStatus = parsed.success
    ? parsed.data
    : "pending";

  return (
    <Badge variant={STATUS_VARIANTS[normalized]}>
      {SPEECH_PROCESS_STATUS_LABELS[normalized]}
    </Badge>
  );
}
