import Link from "next/link";

import { APP_CONFIG } from "@/app/configs/app";
import { ROUTES, signInUrl } from "@/app/configs/routes";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";

import { SiteSignOutButton } from "./site-sign-out-button";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href={ROUTES.PUBLIC.HOME} className="text-lg font-semibold">
          {APP_CONFIG.TITLE}
        </Link>
        <nav className="flex items-center gap-2">
          {session?.user ? (
            <SiteSignOutButton />
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href={signInUrl()}>Sign in</Link>
              </Button>
              <Button asChild>
                <Link href={ROUTES.PUBLIC.SIGNUP}>Sign up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
