import Link from "next/link";

import { SpeechProcessStatusBadge } from "@/app/(cms)/cms/speeches/_components/speech-process-status-badge";
import {
  type PublicationSummary,
  SpeechPublicationStatusBadge,
} from "@/app/(cms)/cms/speeches/_components/speech-publication-status-badge";
import { ROUTES } from "@/app/configs/routes";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatContentLength } from "@/lib/content-length";
import { getScriptLanguageLabel } from "@/lib/script-languages";

type SpeechRow = {
  id: string;
  language: string;
  contentLength: number;
  ttsGeneration: {
    status: "processing" | "finished" | "failed";
    errorMessage: string | null;
  } | null;
  updatedAt: Date;
  publication: PublicationSummary;
  voice: { name: string };
  script: { title: string };
};

function formatUpdatedAt(date: Date) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}

type SpeechesTableProps = {
  speeches: SpeechRow[];
};

export function SpeechesTable({ speeches }: SpeechesTableProps) {
  if (speeches.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No speeches yet.{" "}
        <Link
          href={ROUTES.CMS.SPEECH_NEW}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Create your first speech
        </Link>
        .
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Script</TableHead>
          <TableHead>Voice</TableHead>
          <TableHead>Language</TableHead>
          <TableHead>Length</TableHead>
          <TableHead>Process</TableHead>
          <TableHead>Publication</TableHead>
          <TableHead>Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {speeches.map((speech) => (
          <TableRow key={speech.id}>
            <TableCell className="font-medium">
              <Link
                href={ROUTES.CMS.SPEECH_DETAIL(speech.id)}
                className="hover:underline underline-offset-4"
                prefetch={false}
              >
                {speech.script.title}
              </Link>
            </TableCell>
            <TableCell>{speech.voice.name}</TableCell>
            <TableCell>{getScriptLanguageLabel(speech.language)}</TableCell>
            <TableCell className="tabular-nums text-muted-foreground">
              {formatContentLength(speech.contentLength)}
            </TableCell>
            <TableCell>
              <SpeechProcessStatusBadge status={speech.ttsGeneration?.status} />
            </TableCell>
            <TableCell>
              <SpeechPublicationStatusBadge publication={speech.publication} />
            </TableCell>
            <TableCell>{formatUpdatedAt(speech.updatedAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
