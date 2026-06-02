import Link from "next/link";

import { ROUTES } from "@/app/configs/routes";
import { Button } from "@/components/ui/button";

export default function VoiceNotFound() {
  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Voice not found
        </h1>
        <p className="text-sm text-muted-foreground">
          This voice does not exist or may have been removed.
        </p>
      </div>
      <Button asChild variant="outline" className="w-fit">
        <Link href={ROUTES.CMS.VOICES}>Back to voices</Link>
      </Button>
    </div>
  );
}
