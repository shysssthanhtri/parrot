import Link from "next/link";

import { ROUTES } from "@/app/configs/routes";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getScriptLengthLabel,
  type ScriptGenerationLength,
} from "@/lib/script-generation-prompt";
import { getScriptLanguageLabel } from "@/lib/script-languages";

type ScriptRow = {
  id: string;
  title: string;
  language: string;
  content: string;
  length: string;
  updatedAt: Date;
};

function formatUpdatedAt(date: Date) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}

function contentSnippet(content: string) {
  const maxLength = 80;
  if (content.length <= maxLength) return content;
  return `${content.slice(0, maxLength).trimEnd()}…`;
}

type ScriptsTableProps = {
  scripts: ScriptRow[];
};

export function ScriptsTable({ scripts }: ScriptsTableProps) {
  if (scripts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No scripts yet.{" "}
        <Link
          href={ROUTES.CMS.SCRIPT_NEW}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Create your first script
        </Link>
        .
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Language</TableHead>
          <TableHead>Length</TableHead>
          <TableHead>Content</TableHead>
          <TableHead>Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {scripts.map((script) => (
          <TableRow key={script.id}>
            <TableCell className="font-medium">
              <Link
                href={ROUTES.CMS.SCRIPT_DETAIL(script.id)}
                className="hover:underline underline-offset-4"
                prefetch={false}
              >
                {script.title}
              </Link>
            </TableCell>
            <TableCell>{getScriptLanguageLabel(script.language)}</TableCell>
            <TableCell className="text-muted-foreground">
              {getScriptLengthLabel(script.length as ScriptGenerationLength)}
            </TableCell>
            <TableCell className="max-w-md truncate text-muted-foreground">
              {contentSnippet(script.content)}
            </TableCell>
            <TableCell>{formatUpdatedAt(script.updatedAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
