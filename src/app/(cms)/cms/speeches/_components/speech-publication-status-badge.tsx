import { Badge } from "@/components/ui/badge";

export type PublicationSummary =
  | { status: "not_published" }
  | { status: "published"; publishedAt: Date | null }
  | { status: "unpublished" };

const PUBLICATION_STATUS_LABELS: Record<PublicationSummary["status"], string> =
  {
    not_published: "Not published",
    published: "Published",
    unpublished: "Unpublished",
  };

const PUBLICATION_STATUS_VARIANTS: Record<
  PublicationSummary["status"],
  "default" | "secondary" | "outline"
> = {
  not_published: "secondary",
  published: "default",
  unpublished: "outline",
};

export function getPublicationStatusLabel(publication: PublicationSummary) {
  return PUBLICATION_STATUS_LABELS[publication.status];
}

export function SpeechPublicationStatusBadge({
  publication,
}: {
  publication: PublicationSummary;
}) {
  return (
    <Badge variant={PUBLICATION_STATUS_VARIANTS[publication.status]}>
      {PUBLICATION_STATUS_LABELS[publication.status]}
    </Badge>
  );
}
