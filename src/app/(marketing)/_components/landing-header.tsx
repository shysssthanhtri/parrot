import Link from "next/link";

import { APP_CONFIG } from "@/app/configs/app";
import { ROUTES } from "@/app/configs/routes";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export function LandingHeader() {
  return (
    <header className="border-b">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href={ROUTES.PUBLIC.HOME} className="text-lg font-semibold">
          {APP_CONFIG.TITLE}
        </Link>
        <nav className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="outline" asChild>
            <Link href={ROUTES.LEARN.HOME}>Go to learner space</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
