"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ROUTES } from "@/app/configs/routes";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getScriptLanguageLabel } from "@/lib/script-languages";

type SpeechRow = {
  id: string;
  language: string;
  updatedAt: Date;
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
  const router = useRouter();

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
          <TableHead>Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {speeches.map((speech) => (
          <TableRow
            key={speech.id}
            className="cursor-pointer"
            onClick={() => router.push(ROUTES.CMS.SPEECH_DETAIL(speech.id))}
          >
            <TableCell className="font-medium">{speech.script.title}</TableCell>
            <TableCell>{speech.voice.name}</TableCell>
            <TableCell>{getScriptLanguageLabel(speech.language)}</TableCell>
            <TableCell>{formatUpdatedAt(speech.updatedAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
