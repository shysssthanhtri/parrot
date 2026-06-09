import { ShieldXIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function ForbiddenPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Empty className="max-w-md border-none">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShieldXIcon />
          </EmptyMedia>
          <EmptyTitle>CMS access denied</EmptyTitle>
          <EmptyDescription>
            Your account is signed in but does not have permission to use the
            CMS. Contact an administrator if you need access.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/">Back to home</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  );
}
