import { BookOpen } from "lucide-react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function LearnPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">
          Welcome to Parrot
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          You&apos;re ready to start shadowing. Pick a speech, listen along with
          the transcript, and practice speaking out loud to build natural
          pronunciation and rhythm.
        </p>
        <Empty className="mt-10 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BookOpen />
            </EmptyMedia>
            <EmptyTitle>Speech catalog coming soon</EmptyTitle>
            <EmptyDescription>
              Published speeches will appear here so you can browse topics and
              start practicing. Check back soon.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    </div>
  );
}
