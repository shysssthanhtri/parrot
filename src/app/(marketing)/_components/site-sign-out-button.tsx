"use client";

import { signOut } from "next-auth/react";

import { ROUTES } from "@/app/configs/routes";
import { Button } from "@/components/ui/button";

export function SiteSignOutButton() {
  return (
    <Button
      variant="outline"
      onClick={() => signOut({ callbackUrl: ROUTES.PUBLIC.HOME })}
    >
      Sign out
    </Button>
  );
}
