import Link from "next/link";

import { SiteSignOutButton } from "@/app/(marketing)/_components/site-sign-out-button";
import { APP_CONFIG } from "@/app/configs/app";
import { ROUTES } from "@/app/configs/routes";
import { ThemeToggle } from "@/components/theme-toggle";

export function LearnHeader() {
  return (
    <header className="border-b">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href={ROUTES.PUBLIC.HOME} className="text-lg font-semibold">
          {APP_CONFIG.TITLE}
        </Link>
        <nav className="flex items-center gap-2">
          <ThemeToggle />
          <SiteSignOutButton />
        </nav>
      </div>
    </header>
  );
}
