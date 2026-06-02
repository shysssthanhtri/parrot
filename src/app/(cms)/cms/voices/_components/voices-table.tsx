"use client";

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
type VoiceRow = {
  id: string;
  name: string;
  language: string;
  description: string | null;
  updatedAt: Date;
};

function formatUpdatedAt(date: Date) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}

function descriptionSnippet(description: string | null) {
  if (!description) return "—";
  const maxLength = 80;
  if (description.length <= maxLength) return description;
  return `${description.slice(0, maxLength).trimEnd()}…`;
}

type VoicesTableProps = {
  voices: VoiceRow[];
};

export function VoicesTable({ voices }: VoicesTableProps) {
  const router = useRouter();

  if (voices.length === 0) {
    return <p className="text-sm text-muted-foreground">No voices yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Language</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {voices.map((voice) => (
          <TableRow
            key={voice.id}
            className="cursor-pointer"
            onClick={() => router.push(ROUTES.CMS.VOICE_DETAIL(voice.id))}
          >
            <TableCell className="font-medium">{voice.name}</TableCell>
            <TableCell>{voice.language}</TableCell>
            <TableCell className="max-w-md truncate text-muted-foreground">
              {descriptionSnippet(voice.description)}
            </TableCell>
            <TableCell>{formatUpdatedAt(voice.updatedAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
