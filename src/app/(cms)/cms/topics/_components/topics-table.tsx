"use client";

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

type TopicRow = {
  id: string;
  name: string;
  description: string | null;
  color: string;
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

type TopicsTableProps = {
  topics: TopicRow[];
};

export function TopicsTable({ topics }: TopicsTableProps) {
  if (topics.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No topics yet.{" "}
        <Link
          href={ROUTES.CMS.TOPIC_NEW}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Create your first topic
        </Link>
        .
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {topics.map((topic) => (
          <TableRow key={topic.id}>
            <TableCell className="font-medium">
              <Link
                href={ROUTES.CMS.TOPIC_DETAIL(topic.id)}
                className="inline-flex items-center gap-2 hover:underline underline-offset-4"
                prefetch={false}
              >
                <span
                  className="inline-block h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: topic.color }}
                />
                {topic.name}
              </Link>
            </TableCell>
            <TableCell className="max-w-md truncate text-muted-foreground">
              {descriptionSnippet(topic.description)}
            </TableCell>
            <TableCell>{formatUpdatedAt(topic.updatedAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
