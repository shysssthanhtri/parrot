"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import { ROUTES } from "@/app/configs/routes";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <Button
      variant="destructive"
      onClick={() => signOut({ callbackUrl: ROUTES.PUBLIC.SIGNIN })}
    >
      <LogOut />
      Sign out
    </Button>
  );
}
